import OpenAI from 'openai';
import config from '../config/env.js';
import { resolveMahiEngineConfig } from '../services/mahiEngineResolver.js';
import { ProviderError, TimeoutError, ConfigurationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Dedicated Mahi Engine API Provider (System B)
 * Completely isolated from OpenRouter. Responsible ONLY for communication with
 * the configured Mahi Engine API (MAHI_ENGINE_API_BASE_URL / MAHI_ENGINE_API_KEY).
 */

let clientInstance = null;
let cachedApiKey = null;
let cachedBaseURL = null;

function getMahiClient() {
  const engineConfig = resolveMahiEngineConfig();
  const apiKey = engineConfig.apiKey;
  const baseURL = engineConfig.baseURL;

  if (!apiKey) {
    throw new ConfigurationError('MAHI_ENGINE_API_KEY is not configured in server/.env');
  }

  if (!clientInstance || cachedApiKey !== apiKey || cachedBaseURL !== baseURL) {
    clientInstance = new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: {
        'x-goog-api-key': apiKey
      }
    });
    cachedApiKey = apiKey;
    cachedBaseURL = baseURL;
  }

  return clientInstance;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getMessageLength(msg) {
  if (!msg || !msg.content) return 0;
  if (typeof msg.content === 'string') return msg.content.length;
  if (Array.isArray(msg.content)) {
    return msg.content.reduce((acc, part) => {
      if (part?.type === 'text') return acc + (part.text || '').length;
      if (part?.type === 'image_url') return acc + 1000;
      return acc + 100;
    }, 0);
  }
  return 100;
}

/**
 * Context window cost control: trims excess conversational history while retaining system context
 */
function trimHistoryForCostControl(messages, maxTokensApprox = 25000) {
  if (!Array.isArray(messages) || messages.length <= 1) return messages;

  let totalChars = 0;
  const maxChars = maxTokensApprox * 4;
  const trimmed = [];

  let firstSystem = null;
  if (messages[0]?.role === 'system') {
    firstSystem = messages[0];
    totalChars += getMessageLength(firstSystem);
  }

  const pool = firstSystem ? messages.slice(1) : messages;
  for (let i = pool.length - 1; i >= 0; i--) {
    const msg = pool[i];
    const len = getMessageLength(msg);
    if (totalChars + len > maxChars && trimmed.length >= 2) {
      break;
    }
    totalChars += len;
    trimmed.unshift(msg);
  }

  return firstSystem ? [firstSystem, ...trimmed] : trimmed;
}

/**
 * Formats messages for the Mahi Engine API schema
 */
export function formatMahiMessages({
  messages = [],
  systemInstruction = null,
  projectId = null,
  projectInstructions = null
}) {
  const engineConfig = resolveMahiEngineConfig();
  const formatted = [];

  // 1. Inject project workspace instructions if present
  if (projectInstructions) {
    formatted.push({
      role: 'system',
      content: `PROJECT WORKSPACE INSTRUCTIONS:\nYou are operating within an isolated workspace (Project ID: ${projectId || 'default'}). Adhere strictly to the following instructions:\n${projectInstructions}`
    });
  } else if (projectId) {
    formatted.push({
      role: 'system',
      content: `PROJECT WORKSPACE CONTEXT:\nYou are operating within an isolated workspace for Project ID: ${projectId}. Keep all analysis and code aligned with this project.`
    });
  }

  // 2. Inject specialized Mahi Engine persona / search grounding prompt
  const basePrompt = systemInstruction || engineConfig.systemPrompt;
  if (basePrompt) {
    formatted.push({
      role: 'system',
      content: basePrompt
    });
  }

  // 3. User & Assistant conversational messages
  if (Array.isArray(messages) && messages.length > 0) {
    messages.forEach(m => {
      if (!m) return;
      let contentPayload = m.content;
      if (m.role === 'assistant' && (!contentPayload || (typeof contentPayload === 'string' && !contentPayload.trim()))) {
        contentPayload = m.imageUrl ? (m.imagePrompt ? `[Generated Image: ${m.imagePrompt}]` : '[Generated Image]') : '[Assistant Response]';
      }
      if (!contentPayload || (typeof contentPayload === 'string' && !contentPayload.trim())) {
        return;
      }

      if (typeof contentPayload !== 'string' && !Array.isArray(contentPayload)) {
        contentPayload = JSON.stringify(contentPayload);
      }

      formatted.push({
        role: m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
        content: contentPayload
      });
    });
  }

  return trimHistoryForCostControl(formatted);
}

/**
 * Creates a streaming chat completion using the dedicated Mahi Engine API.
 * Features backoff retry, timeout protection, and clean error sanitization.
 * Does NOT fallback to OpenRouter.
 */
export async function createMahiStreamWithResilience({
  messages = [],
  systemInstruction = null,
  projectId = null,
  projectInstructions = null,
  abortSignal = null,
  timeoutMs = null,
  requestId = '-'
}) {
  const engineConfig = resolveMahiEngineConfig();
  const effectiveTimeout = timeoutMs || engineConfig.timeoutMs || 60000;
  const client = getMahiClient();
  const formattedMessages = formatMahiMessages({
    messages,
    systemInstruction,
    projectId,
    projectInstructions
  });

  let attempts = 0;
  const maxAttempts = 2; // 1 initial + 1 backoff retry for transient network/rate issues

  while (attempts < maxAttempts) {
    attempts++;
    const controller = new AbortController();

    if (abortSignal) {
      if (abortSignal.aborted) {
        throw new ProviderError('Client aborted request', 'mahi-engine');
      }
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const timer = setTimeout(() => {
      controller.abort();
    }, effectiveTimeout);

    try {
      logger.debug(`Initiating Mahi Engine stream with model "${engineConfig.model}" (attempt ${attempts})`, {
        requestId,
        provider: 'mahi-engine',
        engine: engineConfig.engine,
        model: engineConfig.model
      });

      const stream = await client.chat.completions.create(
        {
          model: engineConfig.model,
          messages: formattedMessages,
          temperature: engineConfig.temperature !== undefined ? engineConfig.temperature : 0.35,
          top_p: engineConfig.topP !== undefined ? engineConfig.topP : 0.9,
          max_tokens: engineConfig.maxOutputTokens || 4096,
          stream: true
        },
        { signal: controller.signal }
      );

      clearTimeout(timer);
      return {
        stream,
        resolvedModel: engineConfig.model,
        engine: engineConfig.engine,
        provider: 'mahi-engine'
      };
    } catch (err) {
      clearTimeout(timer);

      if (abortSignal?.aborted) {
        throw new ProviderError('Request cancelled by client', 'mahi-engine');
      }

      if (controller.signal.aborted) {
        throw new TimeoutError(`Mahi Engine request timed out after ${effectiveTimeout}ms`, 'mahi-engine');
      }

      const status = err.status || err.statusCode;
      const isAuthError = status === 401 || status === 403 || (status === 400 && /api[_\s-]?key/i.test(err.message || ''));
      const isTransient = status === 429 || status === 500 || status === 502 || status === 503 || status === 504 ||
        err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

      // Authentication failures should fail fast without retry
      if (isAuthError) {
        logger.error('Mahi Engine authentication error. Check MAHI_ENGINE_API_KEY in server/.env.', {
          requestId,
          status
        });
        throw new ProviderError('Mahi Engine authentication failed: Invalid or missing API key', 'mahi-engine');
      }

      // Transient server/network error -> Exponential backoff retry once
      if (isTransient && attempts < maxAttempts) {
        const delay = 400 * Math.pow(2, attempts - 1);
        logger.warn(`Transient Mahi Engine error (${status || err.code}). Retrying in ${delay}ms...`, {
          requestId,
          error: err.message
        });
        await sleep(delay);
        continue;
      }

      // Clean, sanitized error (do not leak keys, auth headers, or raw stack)
      const sanitizedMessage = String(err.message || 'Mahi Engine stream initialization failed')
        .replace(/AIza[a-zA-Z0-9_\-]{20,}/g, '[REDACTED]')
        .replace(/sk-[a-zA-Z0-9_\-]{16,}/g, '[REDACTED]')
        .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');

      logger.error(`Mahi Engine stream failed on model "${engineConfig.model}"`, {
        requestId,
        error: sanitizedMessage,
        status
      });

      throw new ProviderError(sanitizedMessage, 'mahi-engine', err);
    }
  }

  throw new ProviderError(`Mahi Engine failed after ${maxAttempts} attempts`, 'mahi-engine');
}

export default {
  getMahiClient,
  formatMahiMessages,
  createMahiStreamWithResilience
};
