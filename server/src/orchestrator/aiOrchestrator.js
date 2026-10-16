import config from '../config/env.js';
import {
  isMahiEngine,
  resolveMahiEngineConfig,
  resolveProvider,
  MAHI_ENGINE_SYSTEM_PROMPT
} from '../services/mahiEngineResolver.js';
import {
  detectAndEnrichImageIntent,
  executeImageGeneration,
  extractAttachedImageFromMessage,
  findMostRecentImage,
  isModificationOrReference,
  routeMultimodalIntentAndSynthesizeDelta
} from '../services/imageService.js';
import { fetchWebContext } from '../services/searchService.js';
import { executeDeepResearch } from './researchOrchestrator.js';
import { createCompletionStream, isImageJsonBlock, parseImagePromptFromJsonBlock } from '../services/openrouterService.js';
import { createMahiStreamWithResilience } from '../providers/mahiEngineProvider.js';
import {
  generateCacheKey,
  getCachedStream,
  setCachedStream,
  replayCachedStream,
  getInFlight,
  setInFlight
} from '../services/cacheService.js';
import { recordRequestMetrics } from '../services/usageService.js';
import { ConfigurationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function extractQueryText(content, defaultText = 'Overview') {
  if (!content) return defaultText;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const textParts = content
      .filter(p => p && p.type === 'text')
      .map(p => p.text || '');
    return textParts.join('\n').trim() || defaultText;
  }
  return defaultText;
}

/**
 * Sanitizes conversation history for LLM consumption:
 * 1. Converts assistant image messages into text placeholders.
 * 2. Ensures every message has non-empty text content.
 * 3. Enforces strict role alternation to prevent 400 Bad Request on strict LLM providers (e.g. Claude, Gemini).
 */
export function sanitizeMessagesForLlm(messages = []) {
  if (!Array.isArray(messages)) return [];

  const sanitized = messages.map(m => {
    if (!m) return null;
    const role = m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user');
    let content = m.content;

    if (role === 'assistant') {
      const isMissingText = !content || (typeof content === 'string' && !content.trim());
      if (isMissingText) {
        if (m.imageUrl) {
          content = m.imagePrompt ? `[Generated Image: ${m.imagePrompt}]` : '[Generated Image]';
        } else {
          content = '[Assistant Response]';
        }
      }
    }

    if (!content || (typeof content === 'string' && !content.trim())) {
      return null;
    }

    return {
      role,
      content
    };
  }).filter(Boolean);

  const alternating = [];
  for (const msg of sanitized) {
    if (msg.role === 'system') {
      alternating.push(msg);
      continue;
    }
    const last = alternating[alternating.length - 1];
    if (last && last.role === msg.role && typeof last.content === 'string' && typeof msg.content === 'string') {
      last.content += `\n\n${msg.content}`;
    } else {
      alternating.push({ ...msg });
    }
  }

  return alternating;
}

/**
 * Central AI Orchestrator
 * Unified decision layer coordinating:
 * - System A: Existing Models (GPT, Claude, Gemini, Qwen, DeepSeek) -> OpenRouter Provider -> OpenRouter API
 * - System B: Mahi Engine (Standard) -> Mahi Engine Resolver -> Dedicated Mahi Engine Provider -> Dedicated Mahi Engine API
 * Plus multimodal image synthesis, web search, deep research, isolated caching, and SSE streaming.
 */

/**
 * Orchestrates a single chat / search / image stream request
 */
export async function orchestrateChatRequest({
  messages = [],
  model = 'mahi-engine',
  searchMode = 'none',
  projectId = null,
  projectInstructions = null,
  systemPrompt: customSystemPrompt = null,
  writeChunk,
  isAborted,
  abortSignal,
  requestId = '-'
}) {
  const startTime = Date.now();
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const lastUserQuery = extractQueryText(lastUserMsg?.content, 'Overview');

  // Detect attached image or reference to recent image
  const directImage = extractAttachedImageFromMessage(lastUserMsg);
  const recentImage = directImage || findMostRecentImage(messages);
  const hasImageContext = Boolean(directImage || (recentImage && isModificationOrReference(lastUserQuery)));

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Dynamic Model Vision-to-Image & Image Intent Pipeline
  //    The user's actively selected model acts as the primary brain.
  // ─────────────────────────────────────────────────────────────────────────────
  if (hasImageContext && (directImage || recentImage)) {
    const visionAnalysis = await routeMultimodalIntentAndSynthesizeDelta({
      model,
      query: lastUserQuery,
      imageUrl: directImage || recentImage,
      conversationHistory: messages,
      abortSignal,
      requestId
    });

    if (visionAnalysis.is_edit_request && visionAnalysis.visual_prompt) {
      if (!isAborted()) {
        writeChunk({ type: 'status', message: 'Generating image...' });
      }

      try {
        const result = await executeImageGeneration({
          prompt: visionAnalysis.visual_prompt,
          abortSignal,
          requestId
        });

        if (!result.imageUrl || typeof result.imageUrl !== 'string' || !result.imageUrl.trim()) {
          throw new Error('Image generation returned an empty or invalid image URL');
        }

        if (!isAborted()) {
          writeChunk({
            type: 'image',
            imageUrl: result.imageUrl,
            prompt: result.prompt || visionAnalysis.visual_prompt
          });
          writeChunk('[DONE]');
        }

        recordRequestMetrics({
          requestId,
          provider: 'openrouter',
          model: 'flux.2-klein-4b',
          mode: 'image-generation',
          durationMs: Date.now() - startTime
        });
        return;
      } catch (err) {
        logger.error('Vision-to-image synthesis error in orchestrator', { requestId, error: err.message, stack: err.stack });
        if (!isAborted()) {
          writeChunk({
            type: 'image_error',
            message: 'Unable to generate image, please try again',
            error: err.message || 'Failed to synthesize modified image'
          });
          writeChunk('[DONE]');
        }
        return;
      }
    }
  } else {
    // Pure text-to-image pipeline via the user's selected model
    const imageAnalysis = await detectAndEnrichImageIntent({
      model,
      query: lastUserQuery,
      conversationHistory: messages,
      abortSignal,
      requestId
    });

    if (imageAnalysis.isImage && imageAnalysis.prompt) {
      if (!isAborted()) {
        writeChunk({ type: 'status', message: 'Generating image...' });
      }

      try {
        const result = await executeImageGeneration({
          prompt: imageAnalysis.prompt,
          abortSignal,
          requestId
        });

        if (!result.imageUrl || typeof result.imageUrl !== 'string' || !result.imageUrl.trim()) {
          throw new Error('Image generation returned an empty or invalid image URL');
        }

        if (!isAborted()) {
          writeChunk({
            type: 'image',
            imageUrl: result.imageUrl,
            prompt: result.prompt || imageAnalysis.prompt
          });
          writeChunk('[DONE]');
        }

        recordRequestMetrics({
          requestId,
          provider: 'openrouter',
          model: 'flux.2-klein-4b',
          mode: 'image-generation',
          durationMs: Date.now() - startTime
        });
        return;
      } catch (err) {
        logger.error('Image synthesis error in orchestrator', { requestId, error: err.message, stack: err.stack });
        if (!isAborted()) {
          writeChunk({
            type: 'image_error',
            message: 'Unable to generate image, please try again',
            error: err.message || 'Failed to synthesize image'
          });
          writeChunk('[DONE]');
        }
        return;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Identify System A vs System B (Resolution Layer)
  //    The user's active selected model directly acts as the primary chat engine!
  // ─────────────────────────────────────────────────────────────────────────────
  const isMahi = isMahiEngine(model);
  const provider = resolveProvider(model); // 'mahi-engine' or 'openrouter'
  const engine = isMahi ? 'mahi-engine-standard' : null;
  const targetModel = isMahi ? config.mahiEngine.model : model;

  const sanitizedMessages = sanitizeMessagesForLlm(messages);
  if (sanitizedMessages.length === 0 && lastUserQuery) {
    sanitizedMessages.push({ role: 'user', content: lastUserQuery });
  }

  // Ensure conversational vision query has the image attached for LLM consumption
  if (directImage) {
    const lastUserSanitized = [...sanitizedMessages].reverse().find(m => m.role === 'user');
    if (lastUserSanitized) {
      if (typeof lastUserSanitized.content === 'string') {
        lastUserSanitized.content = [
          { type: 'text', text: lastUserSanitized.content },
          { type: 'image_url', image_url: { url: directImage } }
        ];
      } else if (Array.isArray(lastUserSanitized.content)) {
        const hasImg = lastUserSanitized.content.some(p => p?.type === 'image_url' || p?.type === 'image');
        if (!hasImg) {
          lastUserSanitized.content.push({
            type: 'image_url',
            image_url: { url: directImage }
          });
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Search Grounding & Deep Research Pipelines
  // ─────────────────────────────────────────────────────────────────────────────
  let dynamicSystemInstruction = customSystemPrompt || '';
  let sourcesCount = 0;

  if (searchMode === 'deep-research') {
    const research = await executeDeepResearch({
      query: lastUserQuery,
      onStatusUpdate: async (statusMsg) => {
        if (!isAborted()) {
          writeChunk({ type: 'status', message: statusMsg });
        }
      },
      abortSignal,
      requestId
    });

    if (research.isCasual) {
      const basePrompt = isMahi
        ? MAHI_ENGINE_SYSTEM_PROMPT
        : (dynamicSystemInstruction || 'You are an expert AI research assistant.');
      dynamicSystemInstruction = `${basePrompt}\n\nThe user submitted a casual greeting or non-research remark. Do NOT produce a deep research report or artificial research vectors. Provide a friendly, concise, and helpful greeting and gracefully ask what technical, scientific, empirical, or complex topic they would like to deeply investigate today.`;
    } else {
      if (!isAborted() && research.sources && research.sources.length > 0) {
        sourcesCount = research.sources.length;
        writeChunk({ type: 'sources', data: research.sources });
      }

      const basePrompt = isMahi
        ? MAHI_ENGINE_SYSTEM_PROMPT
        : (dynamicSystemInstruction || 'You are an expert AI research analyst.');

      dynamicSystemInstruction = `${basePrompt}

# ROLE & OBJECTIVE:
You are an elite enterprise research analyst (ChatGPT Deep Research standard). Your task is to produce an authoritative, exhaustive, and rigorously synthesized Deep Research report focused strictly on the user's exact query: "${lastUserQuery}".

# CRITICAL CONSTRAINTS & HALLUCINATION GUARD:
1. STRICT RELEVANCE: You MUST focus 100% of your synthesis on the user's actual topic ("${lastUserQuery}"). Under NO circumstances drift into unrelated frontier AI scaling, LLM test-time compute, or generic AI topics unless the user explicitly asked about artificial intelligence.
2. EMPIRICAL GROUNDING: Ground your technical explanations, industry data, metrics, and case studies on the verified live research snippets provided below.
3. CITATION PROTOCOL: Seamlessly place bracketed numerical citations (e.g. [1], [2], [3]) directly behind factual claims, data points, or assertions corresponding to the numbered research sources. Do NOT dump raw URLs into the text body (the user interface presents interactive source chips and popovers automatically).

# REPORT STRUCTURE (Elite Research Memo Format):
1. **Executive Summary & Core Insights**: High-density strategic synthesis of the topic, foundational findings, and core conclusions.
2. **Deep Dive Sections**: Granular, comprehensive technical breakdowns organized under clear, descriptive markdown headings (###) covering mechanisms, best practices, real-world implementations, and challenges.
3. **Industry Benchmarks, Comparisons & Matrix**: Where relevant, include a structured markdown comparison table, quantitative benchmark metrics, or trade-off evaluation.
4. **Practical Implications & Strategic Takeaways**: Actionable recommendations, operational considerations, and future outlook.

RESEARCH CONTEXT & VERIFIED SOURCES:
${research.contextText || 'Synthesize an exhaustive, first-principles research report strictly focused on: ' + lastUserQuery}`;
    }
  } else if (searchMode === 'web-search') {
    const searchRes = await fetchWebContext({
      query: lastUserQuery,
      abortSignal,
      requestId
    });

    if (!isAborted() && searchRes.sources && searchRes.sources.length > 0) {
      sourcesCount = searchRes.sources.length;
      writeChunk({ type: 'sources', data: searchRes.sources });
    }

    const basePrompt = isMahi
      ? MAHI_ENGINE_SYSTEM_PROMPT
      : (dynamicSystemInstruction || 'You are an expert AI assistant.');

    dynamicSystemInstruction = `${basePrompt}\n\nGround your response strictly on the provided real-time reference material. Write a fluid, natural, and comprehensive answer. Avoid conversational mentions of website names or sources (do not write phrases like "according to [Website] [1]" or "see [Website] [1]"). Instead, state the factual findings directly and seamlessly place bracketed numerical citations like [1], [2] immediately behind the relevant factual assertions, claims, or data points.\n\nREFERENCE CONTEXT:\n${searchRes.contextText}`;
  } else if (isMahi && !dynamicSystemInstruction) {
    dynamicSystemInstruction = MAHI_ENGINE_SYSTEM_PROMPT;
  }

  if (isAborted()) return;

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Cache Layer with Strict Provider & Engine Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  const cacheKey = generateCacheKey({
    provider,
    engine,
    model: targetModel,
    systemPrompt: dynamicSystemInstruction,
    projectInstructions,
    messages: sanitizedMessages,
    searchMode,
    projectId
  });

  const cachedResponse = await getCachedStream(cacheKey, requestId);
  if (cachedResponse && typeof cachedResponse === 'string') {
    await replayCachedStream(cachedResponse, writeChunk, isAborted);
    recordRequestMetrics({
      requestId,
      provider,
      ...(engine ? { engine } : {}),
      model: targetModel,
      mode: searchMode,
      durationMs: Date.now() - startTime,
      cacheHit: true,
      sourcesCount
    });
    return;
  }

  // Stampede protection: check if identical request is currently in-flight
  const inFlight = getInFlight(cacheKey);
  if (inFlight) {
    try {
      const inFlightText = await inFlight;
      if (inFlightText && typeof inFlightText === 'string') {
        await replayCachedStream(inFlightText, writeChunk, isAborted);
        recordRequestMetrics({
          requestId,
          provider,
          ...(engine ? { engine } : {}),
          model: targetModel,
          mode: searchMode,
          durationMs: Date.now() - startTime,
          cacheHit: true,
          sourcesCount
        });
        return;
      }
    } catch (_) {
      // In-flight request failed, fall through to fresh execution
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Credentials Verification & Dev Fallbacks (Provider-Specific)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isMahi) {
    if (!config.mahiEngine.apiKey) {
      if (config.isProd) {
        throw new ConfigurationError('MAHI_ENGINE_API_KEY is not configured in production.');
      }

      const notice = 'MAHI_ENGINE_API_KEY is not set in server/.env. Please configure your dedicated Mahi Engine API key (and optional MAHI_ENGINE_API_BASE_URL / MAHI_ENGINE_MODEL) to enable live Mahi Engine responses.';
      if (!isAborted()) {
        writeChunk({ text: notice });
        writeChunk('[DONE]');
      }
      return;
    }
  } else {
    if (!config.openrouter.apiKey) {
      if (config.isProd) {
        throw new ConfigurationError('OPENROUTER_API_KEY is not configured in production.');
      }

      const fallbackNotice = 'OPENROUTER_API_KEY is not set in server/.env. Please configure your OpenRouter API key to enable live model streaming.';
      if (!isAborted()) {
        writeChunk({ text: fallbackNotice });
        writeChunk('[DONE]');
      }
      return;
    }
  }

  // Setup stampede in-flight promise for concurrent identical requests
  let resolveInFlight = () => { };
  let rejectInFlight = () => { };
  const inFlightPromise = new Promise((resolve, reject) => {
    resolveInFlight = resolve;
    rejectInFlight = reject;
  });
  setInFlight(cacheKey, inFlightPromise);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Provider Execution (Independent System A or System B)
  // ─────────────────────────────────────────────────────────────────────────────
  let stream;
  let resolvedModel;

  try {
    if (isMahi) {
      // SYSTEM B: Dedicated Mahi Engine Provider (never calls OpenRouter)
      const streamResult = await createMahiStreamWithResilience({
        messages: sanitizedMessages,
        systemInstruction: dynamicSystemInstruction,
        projectId,
        projectInstructions,
        abortSignal,
        requestId
      });
      stream = streamResult.stream;
      resolvedModel = streamResult.resolvedModel;
    } else {
      // SYSTEM A: OpenRouter Model Provider (never calls Mahi Engine API)
      const streamResult = await createCompletionStream({
        model,
        messages: sanitizedMessages,
        systemInstruction: dynamicSystemInstruction,
        projectId,
        projectInstructions,
        abortSignal,
        requestId,
        writeChunk
      });
      stream = streamResult.stream;
      resolvedModel = streamResult.resolvedModel;
    }
  } catch (err) {
    rejectInFlight(err);
    if (abortSignal?.aborted || (typeof isAborted === 'function' && isAborted())) {
      logger.debug('Stream cancelled by client during initialization', { requestId, provider });
      return;
    }
    throw err;
  }

  let accumulatedText = '';

  for await (const chunk of stream) {
    if (isAborted()) {
      rejectInFlight(new Error('Client aborted stream'));
      break;
    }
    const content = chunk.choices?.[0]?.delta?.content || '';
    if (content) {
      accumulatedText += content;
      writeChunk({ text: content });
    }
  }

  if (!isAborted()) {
    // If accumulatedText is empty, either the stream completed with 0 text or an image was synthesized and [DONE] was already sent
    if (!accumulatedText || accumulatedText.trim().length === 0) {
      resolveInFlight('');
      return;
    }

    // Failsafe catch-all for raw JSON code blocks printed in text
    if (isImageJsonBlock(accumulatedText)) {
      const prompt = parseImagePromptFromJsonBlock(accumulatedText);
      if (prompt) {
        try {
          if (!isAborted()) {
            writeChunk({ type: 'status', message: 'Generating image...' });
          }
          const result = await executeImageGeneration({
            prompt,
            abortSignal,
            requestId
          });
          if (!result.imageUrl || typeof result.imageUrl !== 'string' || !result.imageUrl.trim()) {
            throw new Error('Image generation returned an empty or invalid image URL');
          }

          if (!isAborted()) {
            writeChunk({
              type: 'image',
              imageUrl: result.imageUrl,
              prompt: result.prompt || prompt
            });
            writeChunk('[DONE]');
          }
          resolveInFlight('');
          return;
        } catch (err) {
          logger.error('Secondary image failsafe error in orchestrator', { requestId, error: err.message, stack: err.stack });
          if (!isAborted()) {
            writeChunk({
              type: 'image_error',
              message: 'Unable to generate image, please try again',
              error: err.message || 'Failed to synthesize visual asset'
            });
            writeChunk('[DONE]');
          }
          resolveInFlight('');
          return;
        }
      }
    }

    writeChunk('[DONE]');
    resolveInFlight(accumulatedText);

    // Async non-blocking cache write
    if (accumulatedText && accumulatedText.trim().length > 0) {
      setCachedStream(cacheKey, accumulatedText, searchMode, requestId).catch(err => {
        logger.warn('Async cache write warning', { requestId, error: err.message });
      });
    }

    recordRequestMetrics({
      requestId,
      provider,
      ...(engine ? { engine } : {}),
      model: resolvedModel,
      mode: searchMode,
      promptLength: JSON.stringify(messages).length,
      completionLength: accumulatedText.length,
      durationMs: Date.now() - startTime,
      cacheHit: false,
      sourcesCount
    });
  } else {
    rejectInFlight(new Error('Client aborted stream'));
  }
}

/**
 * Orchestrates a multi-model compare stream request with isolated error handling and concurrency limits.
 * Models routed to OpenRouter stream via openrouterService.
 * Mahi Engine model routes to dedicated mahiEngineProvider.
 */
export async function orchestrateCompareRequest({
  messages = [],
  models = ['mahi-engine', 'gpt-4o-mini'],
  writeChunk,
  isAborted,
  abortSignal,
  requestId = '-'
}) {
  const startTime = Date.now();
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const lastUserQuery = extractQueryText(lastUserMsg?.content, 'Compare perspective');
  const sanitizedMessages = sanitizeMessagesForLlm(messages);
  if (sanitizedMessages.length === 0 && lastUserQuery) {
    sanitizedMessages.push({ role: 'user', content: lastUserQuery });
  }

  // Safeguard: Deduplicate models and limit to 4
  const uniqueModels = Array.from(new Set(models.filter(Boolean))).slice(0, 4);

  // Parallel resilient streaming completions across all selected models with error isolation
  const streamPromises = uniqueModels.map(async (modelId) => {
    const isMahi = isMahiEngine(modelId);

    // If Mahi Engine is selected in compare mode:
    if (isMahi) {
      if (!config.mahiEngine.apiKey) {
        if (config.isProd) {
          throw new ConfigurationError('MAHI_ENGINE_API_KEY is not configured in production.');
        }
        // Dev fallback simulation for unconfigured Mahi Engine API key
        const mockTokens = [
          `### Mahi Engine Grounded Synthesis\n\n`,
          `Direct evaluation for **"${lastUserQuery}"**:\n\n`,
          `• **Architecture**: Dedicated Mahi Engine integration active.\n`,
          `• **Notice**: Configure MAHI_ENGINE_API_KEY in server/.env for live model responses.`
        ];
        for (const token of mockTokens) {
          if (isAborted()) break;
          await new Promise(r => setTimeout(r, 60));
          if (isAborted()) break;
          writeChunk({ modelId: 'mahi-engine', text: token });
        }
        if (!isAborted()) {
          writeChunk({ type: 'model_done', modelId: 'mahi-engine' });
        }
        return;
      }

      try {
        const { stream } = await createMahiStreamWithResilience({
          messages: sanitizedMessages,
          systemInstruction: MAHI_ENGINE_SYSTEM_PROMPT,
          abortSignal,
          requestId
        });

        for await (const chunk of stream) {
          if (isAborted()) break;
          const text = chunk.choices?.[0]?.delta?.content || '';
          if (text) {
            writeChunk({ modelId: 'mahi-engine', text });
          }
        }

        if (!isAborted()) {
          writeChunk({ type: 'model_done', modelId: 'mahi-engine' });
        }
      } catch (err) {
        logger.error('Error in compare model "mahi-engine"', { requestId, error: err.message });
        if (!isAborted()) {
          writeChunk({
            type: 'model_error',
            modelId: 'mahi-engine',
            error: err.message || 'Mahi Engine API unavailable'
          });
        }
      }
      return;
    }

    // Normal OpenRouter model in compare mode:
    if (!config.openrouter.apiKey) {
      if (config.isProd) {
        throw new ConfigurationError('OPENROUTER_API_KEY is not configured in production.');
      }
      // Dev fallback simulation for unconfigured OpenRouter API key
      const mockTokens = [
        `### ${modelId} Perspective\n\n`,
        `Analysis on **"${lastUserQuery}"**:\n\n`,
        `• **Execution**: Parallel compare channel active.\n`,
        `• **Notice**: Configure OPENROUTER_API_KEY in server/.env for live streaming.`
      ];
      for (const token of mockTokens) {
        if (isAborted()) break;
        await new Promise(r => setTimeout(r, 80));
        if (isAborted()) break;
        writeChunk({ modelId, text: token });
      }
      if (!isAborted()) {
        writeChunk({ type: 'model_done', modelId });
      }
      return;
    }

    try {
      const { stream } = await createCompletionStream({
        model: modelId,
        messages: sanitizedMessages,
        systemInstruction: null,
        abortSignal,
        requestId
      });

      for await (const chunk of stream) {
        if (isAborted()) break;
        const text = chunk.choices?.[0]?.delta?.content || '';
        if (text) {
          writeChunk({ modelId, text });
        }
      }

      if (!isAborted()) {
        writeChunk({ type: 'model_done', modelId });
      }
    } catch (err) {
      logger.error(`Error in compare model "${modelId}"`, { requestId, error: err.message });
      if (!isAborted()) {
        writeChunk({
          type: 'model_error',
          modelId,
          error: err.message || 'Model unavailable via OpenRouter'
        });
      }
    }
  });

  await Promise.allSettled(streamPromises);

  if (!isAborted()) {
    writeChunk('[DONE]');

    recordRequestMetrics({
      requestId,
      provider: 'multi-provider',
      model: `compare:[${uniqueModels.join(',')}]`,
      mode: 'compare',
      durationMs: Date.now() - startTime
    });
  }
}

export default {
  orchestrateChatRequest,
  orchestrateCompareRequest
};
