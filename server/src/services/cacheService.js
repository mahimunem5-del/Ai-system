import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import config from '../config/env.js';
import logger from '../utils/logger.js';

let redisClient = null;
let redisInitialized = false;

// Fallback in-memory cache when Upstash Redis is not configured (limited to 500 entries)
const memoryCache = new Map(); // key -> { content, expiresAt }

// In-flight request map to prevent cache stampede
const inFlightRequests = new Map();

function getRedisInstance() {
  if (redisInitialized) return redisClient;

  const url = config.upstash.redisUrl;
  const token = config.upstash.redisToken;

  if (url && token && url.startsWith('http') && token.length > 5) {
    try {
      redisClient = new Redis({ url, token });
      logger.info('Connected to Upstash Redis Cloud');
    } catch (err) {
      logger.warn('Failed to initialize Upstash Redis. Using in-memory cache fallback.', { error: err.message });
      redisClient = null;
    }
  } else {
    logger.debug('Upstash Redis credentials not configured. In-memory cache active.');
    redisClient = null;
  }

  redisInitialized = true;
  return redisClient;
}

/**
 * Generates a deterministic SHA-256 cache key including provider, engine, workspace, search mode, and normalized messages.
 * Ensures OpenRouter and Mahi Engine cached entries remain strictly isolated.
 */
export function generateCacheKey({
  provider = 'openrouter',
  engine = null,
  model = '',
  systemPrompt = '',
  projectInstructions = '',
  messages = [],
  searchMode = 'none',
  projectId = null,
  userId = null
}) {
  const normProvider = String(provider || 'openrouter').trim().toLowerCase();
  const normEngine = engine ? String(engine).trim().toLowerCase() : 'none';
  const normModel = String(model || '').trim().toLowerCase();
  const normSystemPrompt = String(systemPrompt || '').trim();
  const normProjectInstructions = String(projectInstructions || '').trim();
  const normSearchMode = String(searchMode || 'none').trim().toLowerCase();
  const normProjectId = String(projectId || 'global').trim();
  const normUserId = String(userId || 'anon').trim();

  const normMessages = Array.isArray(messages)
    ? messages.map(m => ({
        role: m.role || 'user',
        content: typeof m.content === 'string' ? m.content.trim() : JSON.stringify(m.content || '')
      }))
    : [];

  const payload = JSON.stringify({
    provider: normProvider,
    engine: normEngine,
    model: normModel,
    systemPrompt: normSystemPrompt,
    projectInstructions: normProjectInstructions,
    searchMode: normSearchMode,
    projectId: normProjectId,
    userId: normUserId,
    messages: normMessages
  });

  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  return `stream_cache:${normProjectId}:${normProvider}:${normModel}:${hash}`;
}

/**
 * Retrieve cached response text if available and valid
 */
export async function getCachedStream(cacheKey, requestId = '-') {
  if (!cacheKey) return null;

  try {
    const redis = getRedisInstance();
    if (redis) {
      const data = await redis.get(cacheKey);
      if (!data) return null;
      logger.debug('Redis cache hit', { requestId, key: cacheKey.slice(0, 32) });
      return typeof data === 'string' ? data : JSON.stringify(data);
    }

    // In-memory cache fallback
    const entry = memoryCache.get(cacheKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryCache.delete(cacheKey);
      return null;
    }
    logger.debug('Memory cache hit', { requestId, key: cacheKey.slice(0, 32) });
    return entry.content;
  } catch (err) {
    logger.warn('Cache lookup error (bypassing)', { requestId, error: err.message });
    return null;
  }
}

/**
 * Store response text in cache with dynamic TTL based on search mode
 */
export async function setCachedStream(cacheKey, content, searchMode = 'none', requestId = '-') {
  if (!cacheKey || !content || typeof content !== 'string' || content.trim().length === 0) {
    return false;
  }

  // Dynamic TTL: 10 mins for real-time web search/research, 24 hours for standard queries
  const isSearch = searchMode === 'web-search' || searchMode === 'deep-research';
  const ttlSeconds = isSearch ? config.upstash.searchCacheTtlSeconds : config.upstash.defaultTtlSeconds;

  try {
    const redis = getRedisInstance();
    if (redis) {
      await redis.set(cacheKey, content, { ex: ttlSeconds });
      return true;
    }

    // Bound in-memory cache to 500 entries to prevent memory exhaustion
    if (memoryCache.size >= 500) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }

    memoryCache.set(cacheKey, {
      content,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
    return true;
  } catch (err) {
    logger.warn('Cache set warning (non-fatal)', { requestId, error: err.message });
    return false;
  }
}

/**
 * Stampede protection: allows concurrent identical requests to await single in-flight resolution
 */
export function getInFlight(key) {
  return inFlightRequests.get(key) || null;
}

export function setInFlight(key, promise) {
  inFlightRequests.set(key, promise);
  promise
    .catch(() => {}) // Prevent unhandled promise rejection if upstream fails or aborts
    .finally(() => {
      inFlightRequests.delete(key);
    });
}

/**
 * Replays a cached response string as SSE chunks with ~10ms delays for natural streaming feel
 */
export async function replayCachedStream(cachedText, writeChunk, isAborted) {
  const tokens = cachedText.match(/(\S+\s*|\s+)/g) || [cachedText];

  for (const token of tokens) {
    if (isAborted()) break;
    writeChunk({ text: token });
    await new Promise(resolve => setTimeout(resolve, 8));
  }

  if (!isAborted()) {
    writeChunk('[DONE]');
  }
}

export default {
  generateCacheKey,
  getCachedStream,
  setCachedStream,
  getInFlight,
  setInFlight,
  replayCachedStream
};
