import logger from '../utils/logger.js';

/**
 * Tracks request metrics, latency, and estimated token usage for cost observability
 */
export function recordRequestMetrics({
  requestId = '-',
  provider = 'openrouter',
  engine = null,
  model = 'unknown',
  mode = 'chat',
  status = 'success',
  promptLength = 0,
  completionLength = 0,
  durationMs = 0,
  cacheHit = false,
  sourcesCount = 0,
  retryCount = 0
}) {
  const estimatedPromptTokens = Math.ceil(promptLength / 4);
  const estimatedCompletionTokens = Math.ceil(completionLength / 4);
  const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

  logger.info('AI Request Completed', {
    requestId,
    provider,
    ...(engine ? { engine } : {}),
    model,
    mode,
    status,
    durationMs,
    cacheHit,
    retryCount,
    promptLength,
    completionLength,
    estimatedTokens: {
      prompt: estimatedPromptTokens,
      completion: estimatedCompletionTokens,
      total: totalTokens
    },
    sourcesCount
  });

  return {
    requestId,
    provider,
    ...(engine ? { engine } : {}),
    model,
    status,
    durationMs,
    cacheHit,
    retryCount,
    estimatedTokens: totalTokens
  };
}

export default {
  recordRequestMetrics
};
