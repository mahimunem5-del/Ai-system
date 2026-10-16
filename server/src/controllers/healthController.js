import config from '../config/env.js';
import { checkDatabaseHealth } from '../db/dbService.js';

const startTime = Date.now();

/**
 * Health and Readiness Check Controller
 * Reports operational status and provider connectivity without exposing credentials.
 */
export async function getHealth(req, res) {
  const dbHealth = await checkDatabaseHealth();

  res.json({
    status: 'ok',
    service: 'Mestrio AI Engine Core',
    version: '1.0.0',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: Date.now(),
    environment: config.env,
    dependencies: {
      openrouter: {
        configured: Boolean(config.openrouter.apiKey),
        status: config.openrouter.apiKey ? 'ready' : (config.isProd ? 'unconfigured' : 'fallback_mode')
      },
      mahiEngine: {
        configured: Boolean(config.mahiEngine.apiKey),
        status: config.mahiEngine.apiKey ? 'ready' : (config.isProd ? 'unconfigured' : 'dev_notice'),
        model: config.mahiEngine.model
      },
      serper: {
        configured: Boolean(config.serper?.apiKey && config.serper?.apiKey !== 'your_serper_api_key_here'),
        status: (config.serper?.apiKey && config.serper?.apiKey !== 'your_serper_api_key_here') ? 'ready' : 'unconfigured'
      },
      fal: {
        configured: Boolean(config.fal.key),
        status: config.fal.key ? 'ready' : (config.isProd ? 'unconfigured' : 'dev_placeholder')
      },
      database: {
        type: dbHealth.type || (config.supabase.url ? 'supabase' : 'in_memory'),
        status: dbHealth.status,
        connected: dbHealth.connected
      },
      cache: {
        type: config.upstash.redisUrl ? 'upstash_redis' : 'in_memory',
        status: config.upstash.redisUrl ? 'ready' : 'in_memory_fallback'
      }
    }
  });
}

export default {
  getHealth
};
