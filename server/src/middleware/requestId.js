import crypto from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = (typeof existingId === 'string' && existingId.length < 64 && /^[a-zA-Z0-9_\-]+$/.test(existingId))
    ? existingId
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

export default requestIdMiddleware;
