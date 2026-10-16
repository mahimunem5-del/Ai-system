import OpenAI from 'openai';
import config from '../config/env.js';
import { ProviderError, TimeoutError, ConfigurationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { getFallbackModel } from '../services/modelRouter.js';
import { IMAGE_GENERATION_TOOL } from '../services/imageService.js';

let clientInstance = null;
let cachedApiKey = null;

function getClient() {
  const apiKey = config.openrouter.apiKey;
  if (!apiKey) {
    throw new ConfigurationError('OPENROUTER_API_KEY is not configured in server/.env');
  }

  if (!clientInstance || cachedApiKey !== apiKey) {
    clientInstance = new OpenAI({
      baseURL: config.openrouter.baseURL,
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': config.openrouter.siteUrl,
        'X-Title': config.openrouter.siteName
      }
    });
    cachedApiKey = apiKey;
  }

  return clientInstance;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates an OpenRouter chat completion stream with retry, timeout, and fallback model protection.
 */
export async function createStreamWithResilience({
  model,
  messages,
  abortSignal,
  timeoutMs = config.timeouts.streamTimeoutMs,
  requestId = '-',
  tools = [IMAGE_GENERATION_TOOL],
  tool_choice = 'auto'
}) {
  const client = getClient();
  let currentModel = model;
  let attempts = 0;
  const maxAttempts = 2; // 1 initial + 1 backoff retry for transient failure

  while (attempts < maxAttempts) {
    attempts++;
    const controller = new AbortController();

    // Link incoming client abort signal if provided
    if (abortSignal) {
      if (abortSignal.aborted) {
        throw new ProviderError('Client aborted request', 'openrouter');
      }
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let requestPayload = null;
    try {
      logger.debug(`Initiating stream with model "${currentModel}" (attempt ${attempts})`, { requestId, model: currentModel });
      console.log(`[OpenRouter Provider] Outgoing model: ${currentModel}`);

      requestPayload = {
        model: currentModel,
        messages,
        max_tokens: config.openrouter.maxOutputTokens || 4096,
        stream: true
      };

      if (tools && tools.length > 0) {
        requestPayload.tools = tools;
        requestPayload.tool_choice = tool_choice;
      }

      const stream = await client.chat.completions.create(
        requestPayload,
        { signal: controller.signal }
      );

      clearTimeout(timer);
      return { stream, resolvedModel: currentModel };
    } catch (err) {
      clearTimeout(timer);

      if (abortSignal?.aborted) {
        throw new ProviderError('Request cancelled by client', 'openrouter');
      }

      if (controller.signal.aborted) {
        throw new TimeoutError(`OpenRouter request timed out after ${timeoutMs}ms`, 'openrouter');
      }

      const status = err.status || err.statusCode;
      const isNotFound = status === 404 ||
        String(err.message || '').includes('404') ||
        String(err.message || '').toLowerCase().includes('not found') ||
        String(err.message || '').toLowerCase().includes('unavailable');

      const isTransient = status === 429 || status === 500 || status === 502 || status === 503 || status === 504 ||
        err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

      // Case 0: Model rejects tools parameter with 400 -> Retry without tools
      if (status === 400 && requestPayload.tools && String(err.message || '').toLowerCase().includes('tool')) {
        logger.warn(`Model "${currentModel}" does not support tools parameter on OpenRouter. Retrying without tools...`, { requestId, error: err.message });
        tools = null;
        continue;
      }

      // Case 1: Model not found or unavailable -> Switch to fallback model immediately
      const fallback = getFallbackModel(currentModel);
      if (isNotFound && currentModel !== fallback) {
        logger.warn(`Model "${currentModel}" unavailable on OpenRouter. Falling back to "${fallback}".`, {
          requestId,
          originalModel: currentModel,
          fallbackModel: fallback,
          error: err.message
        });
        currentModel = fallback;
        continue;
      }

      // Case 2: Transient server error -> Exponential backoff retry once
      if (isTransient && attempts < maxAttempts) {
        const delay = 400 * Math.pow(2, attempts - 1);
        logger.warn(`Transient OpenRouter error (${status || err.code}). Retrying in ${delay}ms...`, { requestId, error: err.message });
        await sleep(delay);
        continue;
      }

      logger.error(`OpenRouter stream failed on model "${currentModel}"`, { requestId, error: err.message, status });
      throw new ProviderError(err.message || 'OpenRouter stream initialization failed', 'openrouter', err);
    }
  }

  throw new ProviderError(`OpenRouter failed after ${maxAttempts} attempts`, 'openrouter');
}

export default {
  getClient,
  createStreamWithResilience
};
