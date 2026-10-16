export interface AIModel {
  id: string;
  name: string;
  provider: 'custom' | 'google' | 'qwen' | 'openai' | 'mistral' | 'nvidia' | 'kimi' | 'deepseek' | 'anthropic' | 'zhipu' | 'xai' | 'mahi' | 'moonshot' | 'alibaba';
  icon: string;
  isLocked: boolean;
  isPro?: boolean;
  isDefault?: boolean;
  badge?: 'New' | 'Thinking';
  tag?: 'New' | 'Thinking' | 'Max';
  group?: string;
  description?: string;
  desc?: string;
  color?: string;
  openRouterModel?: string;
}

export const MODELS: AIModel[] = [
  // 0. Default Engine:
  {
    id: 'mahi-engine',
    name: 'Mahi Engine (Standard)',
    provider: 'custom',
    icon: 'zap',
    isLocked: false,
    isPro: false,
    isDefault: true,
    group: 'Default Engine',
    description: 'Fast, efficient everyday standard engine',
    desc: 'Fast, efficient everyday standard engine',
    color: 'bg-amber-500',
    openRouterModel: 'mahi-engine'
  },

  // 1. OpenAI (ChatGPT Series):
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    icon: 'openai',
    isLocked: true,
    isPro: true,
    group: 'OpenAI (ChatGPT Series)',
    description: 'Lightweight multimodal model by OpenAI',
    desc: 'Lightweight multimodal model by OpenAI',
    color: 'bg-emerald-600',
    openRouterModel: 'openai/gpt-5-mini'
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    icon: 'openai',
    isLocked: true,
    isPro: true,
    group: 'OpenAI (ChatGPT Series)',
    description: 'High-speed reasoning model by OpenAI',
    desc: 'High-speed reasoning model by OpenAI',
    color: 'bg-emerald-700',
    openRouterModel: 'openai/o3-mini'
  },
  {
    id: 'gpt-6-sol',
    name: 'GPT-6 Sol',
    provider: 'openai',
    icon: 'openai',
    isLocked: true,
    isPro: true,
    badge: 'New',
    tag: 'New',
    group: 'OpenAI (ChatGPT Series)',
    description: 'Frontier breakthrough model with solar reasoning',
    desc: 'Frontier breakthrough model with solar reasoning',
    color: 'bg-emerald-800',
    openRouterModel: 'openai/gpt-6-sol'
  },

  // 2. Google (Gemini Series):
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    icon: 'gemini',
    isLocked: true,
    isPro: true,
    group: 'Google (Gemini Series)',
    description: 'Next-gen multimodal speed by Google',
    desc: 'Next-gen multimodal speed by Google',
    color: 'bg-blue-600',
    openRouterModel: 'google/gemini-2.5-flash'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'google',
    icon: 'gemini',
    isLocked: true,
    isPro: true,
    badge: 'New',
    tag: 'New',
    group: 'Google (Gemini Series)',
    description: 'State-of-the-art multimodal frontier speed',
    desc: 'State-of-the-art multimodal frontier speed',
    color: 'bg-blue-800',
    openRouterModel: 'google/gemini-3.8-flash'
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    icon: 'gemini',
    isLocked: true,
    isPro: true,
    group: 'Google (Gemini Series)',
    description: 'Frontier reasoning and multimodality by Google',
    desc: 'Frontier reasoning and multimodality by Google',
    color: 'bg-blue-700',
    openRouterModel: 'google/gemini-3.1-pro-preview'
  },

  // 3. Anthropic (Claude Series):
  {
    id: 'claude-4-5-haiku',
    name: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    icon: 'anthropic',
    isLocked: true,
    isPro: true,
    group: 'Anthropic (Claude Series)',
    description: 'High-speed intelligence by Anthropic',
    desc: 'High-speed intelligence by Anthropic',
    color: 'bg-amber-600',
    openRouterModel: 'anthropic/claude-haiku-4.5'
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    icon: 'anthropic',
    isLocked: true,
    isPro: true,
    group: 'Anthropic (Claude Series)',
    description: 'Exceptional deep coding and nuanced thinking',
    desc: 'Exceptional deep coding and nuanced thinking',
    color: 'bg-amber-700',
    openRouterModel: 'anthropic/claude-sonnet-5'
  },
  {
    id: 'claude-opus-5.5',
    name: 'Claude Opus 5.5',
    provider: 'anthropic',
    icon: 'anthropic',
    isLocked: true,
    isPro: true,
    group: 'Anthropic (Claude Series)',
    description: 'Maximum intelligence for complex synthesis',
    desc: 'Maximum intelligence for complex synthesis',
    color: 'bg-amber-800',
    openRouterModel: 'anthropic/claude-opus-5.5'
  },

  // 4. DeepSeek Series:
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    icon: 'deepseek',
    isLocked: true,
    isPro: true,
    group: 'DeepSeek Series',
    description: 'Ultra-fast open architecture reasoning',
    desc: 'Ultra-fast open architecture reasoning',
    color: 'bg-cyan-600',
    openRouterModel: 'deepseek/deepseek-v4-flash-0731'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    icon: 'deepseek',
    isLocked: true,
    isPro: true,
    badge: 'Thinking',
    tag: 'Thinking',
    group: 'DeepSeek Series',
    description: 'Open reasoning model with deep chain-of-thought',
    desc: 'Open reasoning model with deep chain-of-thought',
    color: 'bg-cyan-600',
    openRouterModel: 'deepseek/deepseek-r1'
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    icon: 'deepseek',
    isLocked: true,
    isPro: true,
    group: 'DeepSeek Series',
    description: 'Unconstrained mathematical & coding performance',
    desc: 'Unconstrained mathematical & coding performance',
    color: 'bg-cyan-700',
    openRouterModel: 'deepseek/deepseek-v4-pro-0813'
  },

  // 5. xAI (Grok Series):
  {
    id: 'grok-4-3',
    name: 'Grok 4.3',
    provider: 'xai',
    icon: 'xai',
    isLocked: true,
    isPro: true,
    group: 'xAI (Grok Series)',
    description: 'Candid and direct intelligence by xAI',
    desc: 'Candid and direct intelligence by xAI',
    color: 'bg-zinc-900',
    openRouterModel: 'x-ai/grok-4.3'
  },
  {
    id: 'grok-4-7',
    name: 'Grok 4.7',
    provider: 'xai',
    icon: 'xai',
    isLocked: true,
    isPro: true,
    badge: 'New',
    tag: 'New',
    group: 'xAI (Grok Series)',
    description: 'Advanced frontier reasoning and depth',
    desc: 'Advanced frontier reasoning and depth',
    color: 'bg-zinc-900',
    openRouterModel: 'x-ai/grok-4.7'
  },

  // 6. Other Providers (Qwen & Kimi):
  {
    id: 'qwen-2.5-coder',
    name: 'Qwen 2.5 Coder',
    provider: 'qwen',
    icon: 'qwen',
    isLocked: true,
    isPro: true,
    group: 'Other Providers (Qwen & Kimi)',
    description: 'Advanced coding & reasoning by Alibaba',
    desc: 'Advanced coding & reasoning by Alibaba',
    color: 'bg-indigo-600',
    openRouterModel: 'qwen/qwen-2.5-coder-32b-instruct'
  },
  {
    id: 'qwen-3.8-max',
    name: 'Qwen 3.8 Max',
    provider: 'qwen',
    icon: 'qwen',
    isLocked: true,
    isPro: true,
    badge: 'Thinking',
    tag: 'Thinking',
    group: 'Other Providers (Qwen & Kimi)',
    description: 'Dense thinking and complex problem solving',
    desc: 'Dense thinking and complex problem solving',
    color: 'bg-orange-600',
    openRouterModel: 'qwen/qwen3.8-max-0902'
  },
  {
    id: 'kimi-k3',
    name: 'Kimi K3',
    provider: 'kimi',
    icon: 'kimi',
    isLocked: true,
    isPro: true,
    badge: 'Thinking',
    tag: 'Thinking',
    group: 'Other Providers (Qwen & Kimi)',
    description: 'Deep chain-of-thought mathematical reasoning',
    desc: 'Deep chain-of-thought mathematical reasoning',
    color: 'bg-zinc-900',
    openRouterModel: 'moonshotai/kimi-k3'
  }
];

export const UNLIMITED_MODELS: AIModel[] = [MODELS[0]];
export const PREMIUM_MODELS: AIModel[] = MODELS.slice(1);

export const DEFAULT_MODEL_LABEL = 'Model';
export const DEFAULT_MODEL_ID = 'mahi-engine';
export const DEFAULT_MODEL_NAME = 'Mahi Engine (Standard)';
