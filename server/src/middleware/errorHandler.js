import { formatErrorForClient, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const reqId = req.id || req.headers?.['x-request-id'] || 'no-id';

  logger.error(err.message || 'Request error', {
    requestId: reqId,
    code: err.code || 'INTERNAL_ERROR',
    statusCode: err.statusCode || 500,
    path: req.originalUrl,
    method: req.method
  });

  // If headers were already sent (e.g. active SSE stream)
  if (res.headersSent) {
    if (!res.writableEnded) {
      try {
        const errorEvent = JSON.stringify({
          error: err.message || 'Streaming failed',
          code: err.code || 'STREAM_ERROR'
        });
        res.write(`data: ${errorEvent}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (_) {
        // Stream already closed
      }
    }
    return;
  }

  const { statusCode, body } = formatErrorForClient(err, reqId);
  res.status(statusCode).json(body);
}

export default {
  notFoundHandler,
  errorHandler
};
