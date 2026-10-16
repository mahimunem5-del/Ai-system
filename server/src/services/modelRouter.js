/**
 * Centralized Model Registry and Dynamic Routing Service
 * Single source of truth for all supported model configurations, aliases, tiers, and capabilities.
 */

export const DEFAULT_MODEL_ID = 'google/gemini-2.5-flash';
export const DEFAULT_FALLBACK_MODEL = 'google/gemini-2.5-flash';

import { isMahiEngine, MAHI_ENGINE_SYSTEM_PROMPT } from './mahiEngineResolver.js';

export { isMahiEngine, MAHI_ENGINE_SYSTEM_PROMPT };

export const MODEL_REGISTRY = {
  // Free / Active Models
  'google/gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 1048576,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'google/gemini-3.8-flash': {
    id: 'google/gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'google',
    tier: 'pro',
    costTier: 'standard',
    contextWindow: 1048576,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'qwen/qwen-2.5-coder-32b-instruct': {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder',
    provider: 'qwen',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'openai/gpt-5-mini': {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 128000,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 128000,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'openai/o3-mini': {
    id: 'openai/o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'openai/gpt-4o-mini'
  },
  'mistralai/mistral-small-24b-instruct-2501': {
    id: 'mistralai/mistral-small-24b-instruct-2501',
    name: 'Mistral Small',
    provider: 'mistral',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false, reasoning: false },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron Fast',
    provider: 'nvidia',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 131072,
    capabilities: { streaming: true, image: false, reasoning: false },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'moonshotai/kimi-k3': {
    id: 'moonshotai/kimi-k3',
    name: 'Kimi K3',
    provider: 'moonshot',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 8192,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'moonshotai/moonshot-v1-8k': {
    id: 'moonshotai/moonshot-v1-8k',
    name: 'Moonshot v1 8k',
    provider: 'moonshot',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 8192,
    capabilities: { streaming: true, image: false, reasoning: false },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 65536,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'deepseek/deepseek-v4-flash-0731': {
    id: 'deepseek/deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    tier: 'free',
    costTier: 'standard',
    contextWindow: 65536,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },

  // Pro / Frontier Models
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 128000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'openai/gpt-4o-mini'
  },
  'google/gemini-pro-1.5': {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 2097152,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'google/gemini-3.1-pro-preview': {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 2097152,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'openai/gpt-6-sol': {
    id: 'openai/gpt-6-sol',
    name: 'GPT-6 Sol',
    provider: 'openai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 128000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'openai/chatgpt-4o-latest': {
    id: 'openai/chatgpt-4o-latest',
    name: 'GPT-6 Sol',
    provider: 'openai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 128000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'openai/gpt-4o-mini'
  },
  'anthropic/claude-sonnet-5': {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'anthropic/claude-haiku-4.5'
  },
  'anthropic/claude-3-5-sonnet': {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'anthropic/claude-3-5-haiku'
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'anthropic/claude-3.5-haiku'
  },
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 65536,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'deepseek/deepseek-chat'
  },
  'deepseek/deepseek-v4-pro-0813': {
    id: 'deepseek/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 65536,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'qwen/qwen3.8-max-0902': {
    id: 'qwen/qwen3.8-max-0902',
    name: 'Qwen 3.8 Max',
    provider: 'qwen',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'qwen/qwen-2.5-coder-32b-instruct'
  },
  'qwen/qwen-2.5-72b-instruct': {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'qwen',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'qwen/qwen-2.5-coder-32b-instruct'
  },
  'qwen/qwen-max': {
    id: 'qwen/qwen-max',
    name: 'Qwen 3.5 Max',
    provider: 'qwen',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'qwen/qwen-2.5-coder-32b-instruct'
  },
  'moonshotai/moonshot-v1-32k': {
    id: 'moonshotai/moonshot-v1-32k',
    name: 'Kimi K3 (32k)',
    provider: 'moonshot',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: 'moonshotai/moonshot-v1-8k'
  },
  'zhipu/glm-4': {
    id: 'zhipu/glm-4',
    name: 'GLM 5.3',
    provider: 'zhipu',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 128000,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'x-ai/grok-4.3': {
    id: 'x-ai/grok-4.3',
    name: 'Grok 4.3',
    provider: 'xai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 131072,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'x-ai/grok-2-1212': {
    id: 'x-ai/grok-2-1212',
    name: 'Grok 4.3',
    provider: 'xai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 131072,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'anthropic/claude-haiku-4.5': {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    tier: 'pro',
    costTier: 'standard',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'anthropic/claude-3-5-haiku': {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    tier: 'pro',
    costTier: 'standard',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'anthropic/claude-3.5-haiku': {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    tier: 'pro',
    costTier: 'standard',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: false, coding: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'x-ai/grok-4.7': {
    id: 'x-ai/grok-4.7',
    name: 'Grok 4.7',
    provider: 'xai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 131072,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'x-ai/grok-2': {
    id: 'x-ai/grok-2',
    name: 'Grok 4.7',
    provider: 'xai',
    tier: 'pro',
    costTier: 'high',
    contextWindow: 131072,
    capabilities: { streaming: true, image: false, reasoning: true },
    fallback: DEFAULT_FALLBACK_MODEL
  },
  'anthropic/claude-opus-5.5': {
    id: 'anthropic/claude-opus-5.5',
    name: 'Claude Opus 5.5',
    provider: 'anthropic',
    tier: 'max',
    costTier: 'ultra',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'anthropic/claude-sonnet-5'
  },
  'anthropic/claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    name: 'Claude Opus 5.5',
    provider: 'anthropic',
    tier: 'max',
    costTier: 'ultra',
    contextWindow: 200000,
    capabilities: { streaming: true, image: false, reasoning: true, coding: true },
    fallback: 'anthropic/claude-sonnet-5'
  }
};

/**
 * Maps frontend dropdown keys, slugs, and UI labels to canonical OpenRouter endpoints.
 */
export const MODEL_ALIASES = {
  // Free / Active Models (Exclusively OpenRouter Models - Mahi Engine is handled by Dedicated System B)
  'gpt-5-mini': 'openai/gpt-5-mini',
  'GPT-5 Mini': 'openai/gpt-5-mini',
  'gpt 5 mini': 'openai/gpt-5-mini',
  'o3-mini': 'openai/o3-mini',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gemini-2-5-flash': 'google/gemini-2.5-flash',
  'Gemini 2.5 Flash': 'google/gemini-2.5-flash',
  'gemini-3.5-flash': 'google/gemini-2.5-flash',
  'gemini-3-5-flash': 'google/gemini-2.5-flash',
  'Gemini 3.5 Flash': 'google/gemini-2.5-flash',
  'qwen-2.5-coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'qwen 2.5 coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'qwen-2-5-coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'Qwen 2.5 Coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'qwen/qwen-2.5-coder-32b-instruct': 'qwen/qwen-2.5-coder-32b-instruct',
  'qwen-3-7-coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'qwen 3.7 coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'Qwen 3.7 Coder': 'qwen/qwen-2.5-coder-32b-instruct',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'GPT-4o Mini': 'openai/gpt-4o-mini',
  'mistral-small': 'mistralai/mistral-small-24b-instruct-2501',
  'Mistral Small': 'mistralai/mistral-small-24b-instruct-2501',
  'nemotron-fast': 'nvidia/llama-3.1-nemotron-70b-instruct',
  'Nemotron Fast': 'nvidia/llama-3.1-nemotron-70b-instruct',
  'kimi-k3-fast': 'moonshotai/kimi-k3',
  'Kimi K3 Fast': 'moonshotai/kimi-k3',
  'deepseek-v4-flash': 'deepseek/deepseek-v4-flash-0731',
  'deepseek v4 flash': 'deepseek/deepseek-v4-flash-0731',
  'DeepSeek V4 Flash': 'deepseek/deepseek-v4-flash-0731',
  'deepseek/deepseek-v4-flash-0731': 'deepseek/deepseek-v4-flash-0731',

  // Pro / Frontier Models
  'gpt-4o': 'openai/gpt-4o',
  'GPT-4o': 'openai/gpt-4o',
  'gemini-3.1-pro': 'google/gemini-3.1-pro-preview',
  'gemini-3-1-pro': 'google/gemini-3.1-pro-preview',
  'gemini 3.1 pro': 'google/gemini-3.1-pro-preview',
  'Gemini 3.1 Pro': 'google/gemini-3.1-pro-preview',
  'google/gemini-3.1-pro-preview': 'google/gemini-3.1-pro-preview',
  'gpt-6-sol': 'openai/gpt-6-sol',
  'gpt 6 sol': 'openai/gpt-6-sol',
  'GPT-6 Sol': 'openai/gpt-6-sol',
  'openai/gpt-6-sol': 'openai/gpt-6-sol',
  'claude-sonnet-5': 'anthropic/claude-sonnet-5',
  'claude sonnet 5': 'anthropic/claude-sonnet-5',
  'Claude Sonnet 5': 'anthropic/claude-sonnet-5',
  'anthropic/claude-sonnet-5': 'anthropic/claude-sonnet-5',
  'anthropic/claude-3.5-sonnet': 'anthropic/claude-3-5-sonnet',
  'deepseek-v4-pro': 'deepseek/deepseek-v4-pro-0813',
  'deepseek v4 pro': 'deepseek/deepseek-v4-pro-0813',
  'DeepSeek V4 Pro': 'deepseek/deepseek-v4-pro-0813',
  'deepseek/deepseek-v4-pro-0813': 'deepseek/deepseek-v4-pro-0813',
  'deepseek-r1': 'deepseek/deepseek-r1',
  'DeepSeek R1': 'deepseek/deepseek-r1',
  'qwen-3.8-max': 'qwen/qwen3.8-max-0902',
  'qwen-3-8-max': 'qwen/qwen3.8-max-0902',
  'qwen 3.8 max': 'qwen/qwen3.8-max-0902',
  'Qwen 3.8 Max': 'qwen/qwen3.8-max-0902',
  'qwen/qwen3.8-max-0902': 'qwen/qwen3.8-max-0902',
  'qwen-3-5-max': 'qwen/qwen-max',
  'Qwen 3.5 Max': 'qwen/qwen-max',
  'kimi-k3': 'moonshotai/kimi-k3',
  'kimi k3': 'moonshotai/kimi-k3',
  'Kimi K3': 'moonshotai/kimi-k3',
  'moonshotai/kimi-k3': 'moonshotai/kimi-k3',
  'glm-5-3': 'zhipu/glm-4',
  'GLM 5.3': 'zhipu/glm-4',
  'grok-4.3': 'x-ai/grok-4.3',
  'grok-4-3': 'x-ai/grok-4.3',
  'grok 4.3': 'x-ai/grok-4.3',
  'Grok 4.3': 'x-ai/grok-4.3',
  'x-ai/grok-4.3': 'x-ai/grok-4.3',
  'claude-4-5-haiku': 'anthropic/claude-haiku-4.5',
  'claude 4.5 haiku': 'anthropic/claude-haiku-4.5',
  'Claude 4.5 Haiku': 'anthropic/claude-haiku-4.5',
  'anthropic/claude-haiku-4.5': 'anthropic/claude-haiku-4.5',
  'grok-4.7': 'x-ai/grok-4.7',
  'grok-4-7': 'x-ai/grok-4.7',
  'grok 4.7': 'x-ai/grok-4.7',
  'Grok 4.7': 'x-ai/grok-4.7',
  'x-ai/grok-4.7': 'x-ai/grok-4.7',
  'gemini-3.8-flash': 'google/gemini-3.8-flash',
  'gemini-3-8-flash': 'google/gemini-3.8-flash',
  'gemini 3.8 flash': 'google/gemini-3.8-flash',
  'Gemini 3.8 Flash': 'google/gemini-3.8-flash',
  'google/gemini-3.8-flash': 'google/gemini-3.8-flash',
  'claude-opus-5.5': 'anthropic/claude-opus-5.5',
  'claude-opus-5-5': 'anthropic/claude-opus-5.5',
  'claude opus 5.5': 'anthropic/claude-opus-5.5',
  'Claude Opus 5.5': 'anthropic/claude-opus-5.5',
  'anthropic/claude-opus-5.5': 'anthropic/claude-opus-5.5'
};

/**
 * Checks if a model identifier is a known registered model, alias, or Mahi Engine.
 */
export function isKnownModel(modelIdentifier) {
  if (!modelIdentifier || typeof modelIdentifier !== 'string') return false;
  if (isMahiEngine(modelIdentifier)) return true;
  const trimmed = modelIdentifier.trim();
  if (MODEL_REGISTRY[trimmed] || MODEL_ALIASES[trimmed]) return true;

  const lower = trimmed.toLowerCase();
  for (const alias of Object.keys(MODEL_ALIASES)) {
    if (alias.toLowerCase() === lower) return true;
  }
  return false;
}

/**
 * Resolves any model identifier, slug, or friendly label to its canonical OpenRouter endpoint.
 */
export function resolveModel(modelIdentifier) {
  if (!modelIdentifier || typeof modelIdentifier !== 'string') {
    return DEFAULT_MODEL_ID;
  }

  const trimmed = modelIdentifier.trim();
  if (!trimmed) return DEFAULT_MODEL_ID;

  // 1. Direct registry lookup if already canonical
  if (MODEL_REGISTRY[trimmed]) {
    return trimmed;
  }

  // 2. Direct exact alias match
  if (MODEL_ALIASES[trimmed]) {
    return MODEL_ALIASES[trimmed];
  }

  // 3. Case-insensitive alias match
  const lower = trimmed.toLowerCase();
  for (const [alias, canonical] of Object.entries(MODEL_ALIASES)) {
    if (alias.toLowerCase() === lower) {
      return canonical;
    }
  }

  // 4. Fuzzy heuristics matching UI labels
  if (lower.includes('mahi') || lower === 'auto' || lower === 'default') {
    return DEFAULT_MODEL_ID;
  }
  if (lower.includes('gemini-3.1') || lower.includes('gemini 3.1') || lower.includes('3-1-pro') || lower.includes('3.1-pro') || lower.includes('gemini-pro')) {
    return 'google/gemini-3.1-pro-preview';
  }
  if (lower.includes('gemini-3.8') || lower.includes('gemini 3.8') || lower.includes('3-8-flash') || lower.includes('3.8-flash')) {
    return 'google/gemini-3.8-flash';
  }
  if (lower.includes('gemini-2.5') || lower.includes('gemini 2.5') || lower.includes('gemini-3.5') || lower.includes('gemini 3.5')) {
    return 'google/gemini-2.5-flash';
  }
  if (lower.includes('qwen-2.5-coder') || lower.includes('qwen-3.7') || lower.includes('coder')) {
    return 'qwen/qwen-2.5-coder-32b-instruct';
  }
  if (lower.includes('qwen') && (lower.includes('3.8') || lower.includes('3-8') || lower.includes('max-0902'))) {
    return 'qwen/qwen3.8-max-0902';
  }
  if (lower.includes('qwen') && lower.includes('72b')) {
    return 'qwen/qwen-2.5-72b-instruct';
  }
  if (lower.includes('qwen') && (lower.includes('max') || lower.includes('3.5'))) {
    return 'qwen/qwen-max';
  }
  if (lower.includes('o3-mini') || lower.includes('o3')) {
    return 'openai/o3-mini';
  }
  if (lower.includes('gpt-5-mini') || lower.includes('5-mini') || lower.includes('5 mini')) {
    return 'openai/gpt-5-mini';
  }
  if (lower.includes('4o-mini') || lower.includes('gpt-4o-mini')) {
    return 'openai/gpt-4o-mini';
  }
  if (lower.includes('gpt-6') || lower.includes('sol')) {
    return 'openai/gpt-6-sol';
  }
  if (lower.includes('gpt-4o') || lower === 'gpt-4o') {
    return 'openai/gpt-4o';
  }
  if (lower.includes('sonnet') || lower.includes('claude-5') || lower.includes('claude 5')) {
    return 'anthropic/claude-sonnet-5';
  }
  if (lower.includes('haiku')) {
    return 'anthropic/claude-haiku-4.5';
  }
  if (lower.includes('opus')) {
    return 'anthropic/claude-opus-5.5';
  }
  if (lower.includes('deepseek') && (lower.includes('r1') || lower.includes('reasoner'))) {
    return 'deepseek/deepseek-r1';
  }
  if (lower.includes('deepseek') && (lower.includes('pro') || lower.includes('0813') || lower.includes('v4-pro') || lower.includes('v4 pro'))) {
    return 'deepseek/deepseek-v4-pro-0813';
  }
  if (lower.includes('deepseek') && (lower.includes('flash') || lower.includes('0731') || lower.includes('v4-flash') || lower.includes('v4 flash'))) {
    return 'deepseek/deepseek-v4-flash-0731';
  }
  if (lower.includes('deepseek')) {
    return 'deepseek/deepseek-chat';
  }
  if (lower.includes('mistral')) {
    return 'mistralai/mistral-small-24b-instruct-2501';
  }
  if (lower.includes('nemotron')) {
    return 'nvidia/llama-3.1-nemotron-70b-instruct';
  }
  if (lower.includes('kimi') || lower.includes('moonshot')) {
    return 'moonshotai/kimi-k3';
  }
  if (lower.includes('glm')) {
    return 'zhipu/glm-4';
  }
  if (lower.includes('grok') && (lower.includes('4.7') || lower.includes('4-7') || lower.includes('4 7'))) {
    return 'x-ai/grok-4.7';
  }
  if (lower.includes('grok') && (lower.includes('4.3') || lower.includes('4-3') || lower.includes('4 3'))) {
    return 'x-ai/grok-4.3';
  }
  if (lower.includes('grok')) {
    return 'x-ai/grok-2';
  }

  // 5. Safe default fallback for unrecognized models (prevents arbitrary model injection)
  return DEFAULT_MODEL_ID;
}

/**
 * Returns metadata and capabilities for a resolved model.
 */
export function getModelMetadata(canonicalModelId) {
  return MODEL_REGISTRY[canonicalModelId] || {
    id: canonicalModelId,
    name: canonicalModelId,
    provider: 'unknown',
    tier: 'standard',
    costTier: 'standard',
    contextWindow: 32768,
    capabilities: { streaming: true, image: false },
    fallback: DEFAULT_FALLBACK_MODEL
  };
}

/**
 * Returns configured fallback model for a given model.
 */
export function getFallbackModel(canonicalModelId) {
  const meta = getModelMetadata(canonicalModelId);
  return meta.fallback || DEFAULT_FALLBACK_MODEL;
}

/**
 * Validates model access against a plan tier (for future plan-based policies).
 */
export function validateModelForPlan(canonicalModelId, userPlan = 'free') {
  const meta = getModelMetadata(canonicalModelId);
  if (userPlan === 'pro' || userPlan === 'max') {
    return { allowed: true };
  }
  // Currently in free tier mode, all configured models are accessible or downgraded gracefully
  return { allowed: true, tier: meta.tier };
}

export default {
  DEFAULT_MODEL_ID,
  DEFAULT_FALLBACK_MODEL,
  MAHI_ENGINE_SYSTEM_PROMPT,
  MODEL_REGISTRY,
  MODEL_ALIASES,
  isMahiEngine,
  isKnownModel,
  resolveModel,
  getModelMetadata,
  getFallbackModel,
  validateModelForPlan
};
