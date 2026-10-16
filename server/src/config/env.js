import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server-level .env first, then root .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';
const isDev = !isProd && !isTest;

export const config = {
  env: NODE_ENV,
  isProd,
  isDev,
  isTest,
  port: parseInt(process.env.PORT || '5001', 10),

  cors: {
    allowedOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://localhost:5001')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
    allowNullOrigin: true // allows local file:// or sandbox testing
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxChatRequests: parseInt(process.env.RATE_LIMIT_MAX_CHAT || '45', 10), // 45 chat requests per minute per IP
    maxGeneralRequests: parseInt(process.env.RATE_LIMIT_MAX_GENERAL || '120', 10) // 120 general requests per minute
  },

  timeouts: {
    streamTimeoutMs: parseInt(process.env.STREAM_TIMEOUT_MS || '60000', 10),
    searchTimeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || '12000', 10),
    imageTimeoutMs: parseInt(process.env.IMAGE_TIMEOUT_MS || '25000', 10)
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY?.trim() || '',
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    siteUrl: process.env.SITE_URL || 'http://localhost:5001',
    siteName: 'Mestrio AI',
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '4096', 10)
  },

  mahiEngine: {
    apiKey: process.env.MAHI_ENGINE_API_KEY?.trim() || '',
    baseURL: process.env.MAHI_ENGINE_API_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: process.env.MAHI_ENGINE_MODEL?.trim() || 'gemini-3.5-flash',
    timeoutMs: parseInt(process.env.MAHI_ENGINE_TIMEOUT_MS || '60000', 10),
    maxOutputTokens: parseInt(process.env.MAHI_ENGINE_MAX_OUTPUT_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.MAHI_ENGINE_TEMPERATURE || '0.35'),
    topP: parseFloat(process.env.MAHI_ENGINE_TOP_P || '0.9')
  },

  serper: {
    apiKey: process.env.SERPER_API_KEY?.trim() || ''
  },

  fal: {
    key: process.env.FAL_KEY?.trim() || ''
  },

  supabase: {
    url: process.env.SUPABASE_URL?.trim() || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''
  },

  upstash: {
    redisUrl: process.env.UPSTASH_REDIS_REST_URL?.trim() || '',
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || '',
    defaultTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '86400', 10), // 24 hours
    searchCacheTtlSeconds: parseInt(process.env.SEARCH_CACHE_TTL_SECONDS || '600', 10) // 10 minutes
  }
};

/**
 * Validates configuration at startup and warns or throws in production.
 */
export function validateConfig() {
  const missingRequired = [];
  const missingOptional = [];

  if (!config.openrouter.apiKey) {
    if (isProd) {
      missingRequired.push('OPENROUTER_API_KEY (Primary AI model streaming provider)');
    } else {
      missingOptional.push('OPENROUTER_API_KEY (AI model responses will operate in fallback mode)');
    }
  }

  if (!config.mahiEngine.apiKey) {
    if (isProd) {
      console.warn('[Config Warning]: MAHI_ENGINE_API_KEY is not set in production. Dedicated Mahi Engine requests will reject until configured.');
    } else {
      missingOptional.push('MAHI_ENGINE_API_KEY (Dedicated Mahi Engine API integration)');
    }
  }

  if (isProd) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      console.warn('[Config Warning]: Running in production without Supabase credentials. Persistent database storage is unconfigured.');
    }
  } else {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      missingOptional.push('SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY (In-memory storage active)');
    }
  }

  if (!config.serper.apiKey || config.serper.apiKey === 'your_serper_api_key_here') {
    missingOptional.push('SERPER_API_KEY (Serper.dev Google Search API grounding)');
  }

  if (!config.fal.key) {
    missingOptional.push('FAL_KEY (FLUX.1 Schnell image generation)');
  }

  if (!config.upstash.redisUrl || !config.upstash.redisToken) {
    missingOptional.push('UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN (In-memory cache & rate limiter active)');
  }

  if (missingRequired.length > 0 && isProd) {
    throw new Error(`[Config Fatal]: Missing required production environment variables:\n  - ${missingRequired.join('\n  - ')}`);
  }

  if (missingOptional.length > 0 && isDev) {
    console.log(`[Config Notice]: Optional services in development fallback:\n  - ${missingOptional.join('\n  - ')}`);
  }
}

export default config;
