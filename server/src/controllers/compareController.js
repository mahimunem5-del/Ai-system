import { orchestrateCompareRequest } from '../orchestrator/aiOrchestrator.js';
import logger from '../utils/logger.js';

/**
 * Multi-Model Compare Controller
 * Sets up SSE stream lifecycle and delegates multi-model orchestration to AI Orchestrator.
 */
export async function streamCompare(req, res, next) {
  const requestId = req.id || 'no-id';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  let isClientDisconnected = false;
  const abortController = new AbortController();

  req.on('aborted', () => {
    isClientDisconnected = true;
    abortController.abort();
    logger.debug('Compare client connection aborted', { requestId });
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      isClientDisconnected = true;
      abortController.abort();
    }
  });

  const checkAborted = () => isClientDisconnected || res.writableEnded;

  const writeChunk = (payload) => {
    if (checkAborted()) return;

    if (payload === '[DONE]') {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const { messages = [], models = ['mahi-engine', 'gpt-4o-mini'] } = req.body || {};

    await orchestrateCompareRequest({
      messages,
      models,
      writeChunk,
      isAborted: checkAborted,
      abortSignal: abortController.signal,
      requestId
    });
  } catch (err) {
    if (checkAborted()) return;

    logger.error('Error during compare stream orchestration', { requestId, error: err.message });
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        if (typeof res.flushHeaders === 'function') res.flushHeaders();
      }
      res.write(`data: ${JSON.stringify({ type: 'stream_error', error: err.message || 'Compare streaming failed' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (_) {
      try { res.end(); } catch (__) { }
    }
  }
}

export default {
  streamCompare
};
