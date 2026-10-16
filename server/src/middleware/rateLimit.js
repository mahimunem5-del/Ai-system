import { Redis } from '@upstash/redis';
import config from '../config/env.js';
import { RateLimitError } from '../utils/errors.js';
import logger from '../utils/logger.js';

let redisClient = null;
let redisInitialized = false;

function getRedisInstance() {
  if (redisInitialized) return redisClient;

  const url = config.upstash.redisUrl;
  const token = config.upstash.redisToken;

  if (url && token && url.startsWith('http') && token.length > 5) {
    try {
      redisClient = new Redis({ url, token });
    } catch (err) {
      logger.warn('Failed to initialize Redis for rate limiting. Using in-memory store.', { error: err.message });
      redisClient = null;
    }
  }

  redisInitialized = true;
  return redisClient;
}

// In-Memory sliding-window rate limit store (key -> Array<timestamp>)
const memoryStore = new Map();

// Clean up stale memory records every 60 seconds
setInterval(() => {
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  for (const [key, timestamps] of memoryStore.entries()) {
    const valid = timestamps.filter(t => now - t < windowMs);
    if (valid.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, valid);
    }
  }
}, 60000).unref();

/**
 * Creates rate limit middleware configured for a specific limit, window, and client scope.
 */
export function createRateLimiter(options = {}) {
  const limit = options.limit || config.rateLimit.maxGeneralRequests;
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const prefix = options.prefix || 'rl';

  return async function rateLimitMiddleware(req, res, next) {
    // 1. Determine client identifier (IP address)
    // IMPORTANT: In the absence of cryptographic authentication (e.g. verified session/JWT),
    // arbitrary client-supplied headers like X-User-ID must NEVER be trusted to bypass IP rate limits.
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
    const identifier = `ip:${clientIp}`;
    const key = `ratelimit:${prefix}:${identifier}`;
    const now = Date.now();

    // 2. Try Upstash Redis distributed rate limiting if configured
    const redis = getRedisInstance();
    if (redis) {
      try {
        const windowSeconds = Math.ceil(windowMs / 1000);
        const currentCount = await redis.incr(key);

        if (currentCount === 1) {
          await redis.expire(key, windowSeconds);
        }

        const remaining = Math.max(0, limit - currentCount);
        const ttl = await redis.ttl(key);
        const resetSeconds = ttl > 0 ? ttl : windowSeconds;

        res.setHeader('RateLimit-Limit', limit);
        res.setHeader('RateLimit-Remaining', remaining);
        res.setHeader('RateLimit-Reset', resetSeconds);

        if (currentCount > limit) {
          return next(new RateLimitError(`Rate limit exceeded (${limit} requests per minute). Please wait ${resetSeconds}s before retrying.`, resetSeconds));
        }

        return next();
      } catch (redisErr) {
        logger.warn('Redis rate limit check error. Falling back to memory store.', { error: redisErr.message });
      }
    }

    // 3. Resilient In-Memory Sliding-Window Fallback
    let timestamps = memoryStore.get(key) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    const currentCount = timestamps.length;
    const remaining = Math.max(0, limit - currentCount - 1);
    const resetSeconds = Math.ceil((windowMs - (now - (timestamps[0] || now))) / 1000) || Math.ceil(windowMs / 1000);

    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (currentCount >= limit) {
      return next(new RateLimitError(`Rate limit exceeded (${limit} requests per minute). Please wait ${resetSeconds}s before retrying.`, resetSeconds));
    }

    timestamps.push(now);
    memoryStore.set(key, timestamps);
    next();
  };
}

export const chatRateLimiter = createRateLimiter({
  limit: config.rateLimit.maxChatRequests,
  prefix: 'chat'
});

export const generalRateLimiter = createRateLimiter({
  limit: config.rateLimit.maxGeneralRequests,
  prefix: 'gen'
});

export default {
  createRateLimiter,
  chatRateLimiter,
  generalRateLimiter
};
