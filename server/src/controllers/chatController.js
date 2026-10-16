import { orchestrateChatRequest } from '../orchestrator/aiOrchestrator.js';
import logger from '../utils/logger.js';

/**
 * Chat Stream Controller
 * Handles SSE protocol negotiation, client abort signals, and delegates to AI Orchestrator.
 */
export async function streamChat(req, res, next) {
  const requestId = req.id || 'no-id';

  // Setup standard SSE Headers
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
    logger.debug('Client connection aborted', { requestId });
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
    const {
      messages = [],
      model = 'mahi-engine',
      searchMode = 'none',
      projectId = null,
      projectInstructions = null,
      systemPrompt = null
    } = req.body || {};

    await orchestrateChatRequest({
      messages,
      model,
      searchMode,
      projectId,
      projectInstructions,
      systemPrompt,
      writeChunk,
      isAborted: checkAborted,
      abortSignal: abortController.signal,
      requestId
    });
  } catch (err) {
    if (checkAborted()) return;

    logger.error('Error during chat stream orchestration', { requestId, error: err.message });
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        if (typeof res.flushHeaders === 'function') res.flushHeaders();
      }
      res.write(`data: ${JSON.stringify({ text: `\n\n[Error: ${err.message || 'Stream processing failed'}]` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (_) {
      try { res.end(); } catch (__) { }
    }
  }
}

export default {
  streamChat
};
