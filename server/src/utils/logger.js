import config from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'apikey',
  'api_key',
  'token',
  'authorization',
  'secret',
  'password',
  'supabase_key',
  'service_role'
]);

function redact(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return obj;
  if (Array.isArray(obj)) return obj.map(item => redact(item, depth + 1));

  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('key') || lowerKey.includes('token')) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      cleaned[key] = redact(val, depth + 1);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const requestId = meta.requestId || meta.id || '-';
  const cleanMeta = redact(meta);

  // If in dev, produce clean readable string; in prod, produce structured JSON
  if (config.isDev) {
    const metaStr = Object.keys(cleanMeta).length > 0 ? ` ${JSON.stringify(cleanMeta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [req:${requestId}] ${message}${metaStr}`;
  }

  return JSON.stringify({
    timestamp,
    level,
    requestId,
    message,
    ...cleanMeta
  });
}

export const logger = {
  info(message, meta) {
    console.log(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message, meta) {
    if (!config.isProd) {
      console.debug(formatMessage('debug', message, meta));
    }
  }
};

export default logger;
