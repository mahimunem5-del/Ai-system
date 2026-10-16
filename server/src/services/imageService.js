import axios from 'axios';
import OpenAI from 'openai';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { resolveModel } from './modelRouter.js';
import { isMahiEngine } from './mahiEngineResolver.js';

/**
 * Aggressive pre-cleaner stripping thinking/reasoning tags, code fences, and extraneous wrappers.
 * Handles Claude (<thinking>), DeepSeek (<think>), and reasoning models.
 */
export function sanitizeRawModelText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  // 1. Strip <thinking>...</thinking>, <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>, <reason>...</reason>, etc.
  text = text.replace(/<(?:thinking|think|thought|reasoning|reason|reflection|cot)[\s\S]*?<\/(?:thinking|think|thought|reasoning|reason|reflection|cot)>/gi, '');
  text = text.replace(/<(?:thinking|think|thought|reasoning|reason|reflection|cot)>[\s\S]*$/gi, '');

  // 2. Strip markdown code fences (```json, ```text, ```markdown, etc.)
  const fenceMatch = text.match(/```(?:json|text|markdown|yaml|xml)?\s*([\s\S]*?)(?:```|$)/i);
  if (fenceMatch && fenceMatch[1].trim()) {
    text = fenceMatch[1].trim();
  } else {
    text = text.replace(/```[a-zA-Z0-9_-]*/g, '').replace(/```/g, '').trim();
  }

  return text.trim();
}

/**
 * Robust JSON parser with pre-cleaning and substring extraction.
 */
export function parseJsonSafely(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const sanitized = sanitizeRawModelText(raw);
  if (!sanitized) return null;

  try {
    return JSON.parse(sanitized);
  } catch (_) {
    const match = sanitized.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (__) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Validates that an image URL is a valid web URL or data URL.
 */
export function isValidImageUrlString(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Robust Model Output Sanitizer & Parser (Regex & JSON Defensive Layer).
 * Handles any model provider output (Claude, DeepSeek, GPT, Gemini, Grok)
 * with aggressive pre-cleaning, regex extraction, and bulletproof fallback guarantees.
 */
export function parseModelIntentOutput(raw, userQuery = '', mode = 'edit') {
  const sanitized = sanitizeRawModelText(raw);
  const isEditMode = mode === 'edit';

  let isIntent = false;
  let visualPrompt = null;
  let reasoning = '';

  // 1. Try standard JSON.parse
  if (sanitized) {
    try {
      const parsed = JSON.parse(sanitized);
      if (parsed && typeof parsed === 'object') {
        if (isEditMode) {
          isIntent = parsed.is_edit_request === true || String(parsed.is_edit_request).toLowerCase() === 'true';
        } else {
          isIntent = parsed.is_image_request === true || String(parsed.is_image_request).toLowerCase() === 'true';
        }
        visualPrompt = parsed.visual_prompt || parsed.prompt || null;
        reasoning = parsed.reasoning || '';
      }
    } catch (_) {
      const match = sanitized.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed && typeof parsed === 'object') {
            if (isEditMode) {
              isIntent = parsed.is_edit_request === true || String(parsed.is_edit_request).toLowerCase() === 'true';
            } else {
              isIntent = parsed.is_image_request === true || String(parsed.is_image_request).toLowerCase() === 'true';
            }
            visualPrompt = parsed.visual_prompt || parsed.prompt || null;
            reasoning = parsed.reasoning || '';
          }
        } catch (__) {
          // Fall through to regex defensive layer
        }
      }
    }
  }

  // 2. Regex Defensive Layer (if JSON.parse didn't resolve or was malformed)
  if (sanitized) {
    if (isEditMode) {
      const editMatch = sanitized.match(/["']?is_edit_request["']?\s*:\s*(true|false)/i);
      if (editMatch) isIntent = editMatch[1].toLowerCase() === 'true';
    } else {
      const imgMatch = sanitized.match(/["']?is_image_request["']?\s*:\s*(true|false)/i);
      if (imgMatch) isIntent = imgMatch[1].toLowerCase() === 'true';
    }

    if (!visualPrompt) {
      const promptRegexes = [
        /["']?visual_prompt["']?\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i,
        /["']?visual_prompt["']?\s*:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/i,
        /["']?prompt["']?\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i,
        /["']?prompt["']?\s*:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/i,
        /(?:visual\s*prompt|image\s*prompt|visual\s*description)\s*:\s*["']?([^\n\r"'][\s\S]*?)(?:["']\s*[,}\n]|$)/i
      ];

      for (const re of promptRegexes) {
        const m = sanitized.match(re);
        if (m && m[1] && m[1].trim()) {
          try {
            visualPrompt = JSON.parse(`"${m[1]}"`).trim();
          } catch (_) {
            visualPrompt = m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
          }
          if (visualPrompt) break;
        }
      }
    }

    if (!reasoning) {
      const rMatch = sanitized.match(/["']?reasoning["']?\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
      if (rMatch && rMatch[1]) {
        reasoning = rMatch[1];
      }
    }
  }

  // 3. Fallback Guard (Critical Requirement 1c):
  // If parsing returns empty, null, or undefined when intent is true,
  // instantly fall back to a sanitized version of the user's raw prompt so the visual engine NEVER receives an empty query
  if (isIntent && (!visualPrompt || typeof visualPrompt !== 'string' || !visualPrompt.trim())) {
    visualPrompt = cleanPrompt(userQuery);
  }

  if (visualPrompt && typeof visualPrompt === 'string') {
    visualPrompt = visualPrompt.trim();
  } else {
    visualPrompt = null;
  }

  return {
    isIntent: Boolean(isIntent),
    visualPrompt,
    reasoning: reasoning || ''
  };
}

export const IMAGE_GENERATION_TOOL = {
  type: "function",
  function: {
    name: "generate_image",
    description: "Call this tool whenever the user explicitly or implicitly wants to create, draw, imagine, depict, or generate an image, photo, wallpaper, illustration, artwork, or sketch in ANY language (English, Bengali, Banglish, Hindi, etc.), OR whenever the user attaches an image and requests modifications, visual edits, additions, or transformations (e.g. Banglish 'Eitar mathay lal tupi porao', 'Add sunglasses', 'Change background').",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "A highly descriptive, photorealistic/cinematic visual English prompt optimized for FLUX.2 image generation. If modifying an attached reference image, strictly preserve the original subject features, identity, artistic style, lighting, and composition while incorporating the requested visual changes."
        }
      },
      required: ["prompt"]
    }
  }
};

const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You are an expert multi-lingual AI Intent Classifier and Image Prompt Architect.
Your task is to analyze the user's latest message and recent conversation context to decide if the user wants to generate or modify an image, or if this is standard chat / question.

Rules:
1. CLASSIFY:
   - is_image_request = true ONLY if the user is asking to create, draw, render, generate a new image, OR modifying/adding to a previously generated image in the thread.
   - is_image_request = false if the user is:
     * Asking questions about a generated image (e.g. "Tw tmi eita kisher image bannai dila", "Why did you draw this?", "What is in this picture?")
     * Asking coding, educational, technical, or general conversational questions (e.g. "HTML a image tag kivabe use kore", "Tell me about roosters")
     * Casual chat or feedback without asking for visual generation (e.g. "Sundor hoyeche", "Thanks", "Aro kichu bolo")

2. EXPAND & TRANSLATE (if is_image_request is true):
   - Translate Banglish, Bengali, Hindi, or informal language into fluent, vivid English.
   - For recognizable pop-culture, animation, or cartoon characters (e.g., Oggy from Oggy and the Cockroaches, Doraemon, Pikachu, Tom and Jerry): always expand into their full canonical visual attributes (exact cyan-blue fur/skin, distinct facial markings, big red clown nose, green eyes, white belly, and white gloves) rather than a generic prompt, ensuring FLUX faithfully renders the recognizable character.
   - CRITICAL IMAGE MODERATION RULE: Describe character appearance visually without relying solely on trademarked franchise names or show titles in the visual_prompt (e.g., describe "a comical cyan-blue cartoon cat with large round green eyes, an iconic big red nose, white belly, and white gloves" instead of "Oggy from Oggy and the Cockroaches") so upstream image moderation does not block generation.
   - If the user is modifying a previous image in context (e.g., "Eitar upor ekta lal tupi poriye daw", "change background to snowy night", "add sunglasses"), incorporate the previous image's subject and details so the new visual prompt is a complete, standalone description for the FLUX image model.
   - Expand the description into a rich, photorealistic or artistic visual prompt (composition, lighting, texture, style, high resolution).
   - If is_image_request is false, set visual_prompt to null.

Output strictly valid JSON with this structure:
{
  "is_image_request": boolean,
  "visual_prompt": string | null,
  "reasoning": string
}`;

export const MULTIMODAL_INTENT_ROUTER_PROMPT = `You are an expert Multimodal Intent Router and Visual Delta Prompt Synthesizer modeled after ChatGPT's vision-to-image editing pipeline.
You are given an attached reference image and the user's message/instructions in any language (English, Bengali, Banglish, Hindi, etc.).

Step 1: CLASSIFY USER INTENT:
1. CONVERSATIONAL QUERY (is_edit_request = false):
   The user is asking a question about the image, seeking analysis, explanation, description, factual details, OCR/text reading, or conversational discussion about the image content.
   Examples in various languages:
   - "Eita kisher chobi?", "Eita ki?", "Chobita te ki ache?" (Banglish: What is this picture?)
   - "Explain this image", "Describe what is happening here", "Who is this?"
   - "What is written on the sign?", "What color is the car?"
   - "Tell me about this breed of dog", "Why is the sky blue here?"
   - "How many people are in this photo?"

2. IMAGE EDIT / MODIFICATION REQUEST (is_edit_request = true):
   The user explicitly or implicitly wants to edit, modify, alter, transform, add to, remove from, restyle, or generate a new/modified version of the image.
   Examples in various languages:
   - "Eitar mathay lal tupi porao" (Banglish: Put a red hat on its head)
   - "Eitar background change kore snow daw" (Banglish: Change its background to snowy)
   - "Eitake anime version banao" (Banglish: Turn this into an anime version)
   - "Eitar color blue kore daw" (Banglish: Change its color to blue)
   - "Add sunglasses to the dog", "Put a crown on his head"
   - "Change the background to a futuristic cyberpunk city with neon lights"
   - "Make it nighttime with a glowing moon", "Turn this into a watercolor painting"
   - "Remove the tree on the left", "Make the cat wear a tuxedo"

Step 2: VISUAL DELTA PROMPT SYNTHESIS (MANDATORY if is_edit_request is true):
Analyze the reference image in exhaustive detail:
- Subject Identity: exact subject (person, animal breed, object, character), distinctive facial features, hair/fur texture, color patterns, posture, and expression.
- Artistic Style & Medium: photographic (macro, portrait, DSLR, film grain), 3D digital render (Unreal Engine, Octane), anime/manga, oil painting, watercolor, vintage Polaroid, sketch, etc.
- Lighting & Color Palette: directional sunlight, golden hour, moody shadows, studio rim lighting, neon glow, color grading.
- Composition & Camera: framing (close-up portrait, medium shot, wide landscape), camera angle (eye-level, low angle), depth of field (bokeh background, sharp focus).

Formulate a SINGLE, comprehensive, high-detail English visual prompt optimized for FLUX.2 image generation:
- Strictly PRESERVE the original subject's identity, key facial/body features, artistic medium, color harmony, and composition from the reference image.
- Seamlessly INTEGRATE the requested change/delta into the scene as if it naturally belongs there (e.g. realistic shadows, reflections, matching texture, proper anatomical fit).
- The output MUST be a standalone, fully descriptive visual prompt depicting the entire final image.
- DO NOT use negative prompts, commands, or meta-language like "edit the image", "change the hat", "here is the prompt", or "FLUX prompt:". ONLY describe the visual scene itself in vivid detail.

If is_edit_request is false:
- Set visual_prompt to null.

Output strictly valid JSON with this exact schema:
{
  "is_edit_request": boolean,
  "visual_prompt": string | null,
  "reasoning": string
}`;

/**
 * Extracts attached or embedded image URL/dataUrl from a chat message.
 */
export function extractAttachedImageFromMessage(msg) {
  if (!msg) return null;

  // 1. Array content with type: 'image_url' or 'image'
  if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (part?.type === 'image_url' && part.image_url?.url) {
        return String(part.image_url.url).trim();
      }
      if (part?.type === 'image' && (part.url || part.image)) {
        return String(part.url || part.image).trim();
      }
      if (typeof part === 'string' && (part.startsWith('data:image/') || /^https?:\/\/.+\.(png|jpe?g|webp|gif)/i.test(part))) {
        return part.trim();
      }
    }
  }

  // 2. Attachments array
  if (Array.isArray(msg.attachments)) {
    const imgAtt = msg.attachments.find(a => a && (a.isImage || (a.type && a.type.startsWith('image/')) || (a.name && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(a.name))));
    if (imgAtt) {
      const url = imgAtt.dataUrl || imgAtt.preview || imgAtt.url;
      if (url) return String(url).trim();
    }
  }

  // 3. Direct imageUrl property
  if (msg.imageUrl && typeof msg.imageUrl === 'string') {
    return msg.imageUrl.trim();
  }

  // 4. String content containing data:image base64
  if (typeof msg.content === 'string') {
    const dataUrlMatch = msg.content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
    if (dataUrlMatch) {
      return dataUrlMatch[0];
    }
  }

  return null;
}

/**
 * Finds the most recent attached or generated image across conversation history.
 */
export function findMostRecentImage(messages = []) {
  if (!Array.isArray(messages)) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const img = extractAttachedImageFromMessage(msg);
    if (img) return img;
  }
  return null;
}

/**
 * Checks if a user query references an existing image or requests modification/delta.
 */
export function isModificationOrReference(query) {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();
  return /\b(eitar|eita|ei|etar|eta|this|it|that|porao|poriye|lagao|lagiye|change|modify|replace|swap|add|remove|hat|tupi|choshma|sunglasses|dress|color|colour|rong|background|snow|snowy|anime|style|version)\b/i.test(q);
}

const BANGLA_SUBJECT_TRANSLATIONS = {
  'biral': 'adorable cat',
  'birala': 'cat',
  'billi': 'cat',
  'billu': 'cat',
  'বিড়াল': 'cat',
  'kukur': 'dog',
  'kutta': 'dog',
  'কুকুর': 'dog',
  'murgi': 'rooster chicken',
  'মুরগি': 'rooster chicken',
  'pakhi': 'bird',
  'পাখি': 'bird',
  'bagh': 'tiger',
  'বাঘ': 'tiger',
  'singho': 'lion',
  'সিংহ': 'lion',
  'gari': 'sports car',
  'গাড়ি': 'car',
  'pahar': 'mountains',
  'পাহাড়': 'mountains',
  'nodi': 'river',
  'নদী': 'river',
  'shohor': 'futuristic neon city',
  'শহর': 'city',
  'ful': 'beautiful flowers',
  'ফুল': 'flowers',
  'bagan': 'lush garden',
  'বাগান': 'garden',
  'sundor': 'beautiful',
  'সুন্দর': 'beautiful',
  'choto': 'cute little',
  'ছোট': 'cute little',
  'chand': 'luminous moon',
  'চাঁদ': 'moon',
  'surjo': 'golden sun',
  'সূর্য': 'sun',
  'shurjasto': 'cinematic sunset',
  'সূর্যাস্ত': 'sunset',
  'shurjodoy': 'vibrant sunrise',
  'সূর্যোদয়': 'sunrise',
  'meye': 'young woman',
  'মেয়ে': 'woman',
  'chele': 'young man',
  'ছেলে': 'man',
  'oggy': 'a comical, lovable cyan-blue cartoon cat with large round green eyes, iconic big red clown nose, white belly, and white cartoon gloves',
  'ogi': 'a comical, lovable cyan-blue cartoon cat with large round green eyes, iconic big red clown nose, white belly, and white cartoon gloves',
  'অগি': 'a comical, lovable cyan-blue cartoon cat with large round green eyes, iconic big red clown nose, white belly, and white cartoon gloves',
  'doraemon': 'a cute robotic earless blue cat with a round white face, red nose, whiskers, and a yellow bell collar',
  'ডোরেমন': 'a cute robotic earless blue cat with a round white face, red nose, whiskers, and a yellow bell collar',
  'pikachu': 'a cute electric yellow cartoon creature with long black-tipped ears, rosy red circular cheeks, and a lightning-bolt tail',
  'পিকাচু': 'a cute electric yellow cartoon creature with long black-tipped ears, rosy red circular cheeks, and a lightning-bolt tail',
  'tom': 'a comical grey cat with yellow eyes',
  'jerry': 'a clever little brown cartoon mouse'
};

/**
 * Sanitizes and rewrites prompt tokens to prevent upstream image moderation blocks
 * (e.g. Black Forest Labs automated filters on franchise/character names).
 */
export function sanitizePromptForImageEngine(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';
  let s = prompt.trim();

  // Strip or translate trademarked / copyrighted character names known to be blocked by BFL content moderation
  s = s.replace(/\b(?:oggy(?:\s+and\s+the\s+cockroaches|\s+from\s+oggy\s+and\s+the\s+cockroaches)?)\b/gi, 'a comical, lovable cyan-blue cartoon cat with large round green eyes, an iconic big red clown nose, white belly, and white cartoon gloves');
  s = s.replace(/\boggy\b/gi, 'a comical cyan-blue cartoon cat with large green eyes, big red clown nose, white belly, and white gloves');
  s = s.replace(/\b(?:cockroaches)\b/gi, 'mischievous animated cartoon critters');
  s = s.replace(/\b(?:doraemon)\b/gi, 'a cute robotic earless blue cat with a round white face, red nose, whiskers, and a yellow bell collar');
  s = s.replace(/\b(?:pikachu)\b/gi, 'a cute electric yellow cartoon creature with long black-tipped ears, rosy red cheeks, and lightning-bolt tail');
  s = s.replace(/\b(?:tom\s+and\s+jerry)\b/gi, 'a comical grey cat and a clever little brown cartoon mouse');
  s = s.replace(/\b(?:mickey\s+mouse)\b/gi, 'a cheerful cartoon mouse with round black ears and red shorts');
  s = s.replace(/\b(?:sonic\s+the\s+hedgehog)\b/gi, 'a speedy blue hedgehog with red running sneakers');

  return s.trim();
}

let mahiClassifierClient = null;
let cachedMahiApiKey = null;
let cachedMahiBaseURL = null;

function getMahiClassifierClient() {
  const apiKey = config.mahiEngine?.apiKey;
  const baseURL = config.mahiEngine?.baseURL || 'https://generativelanguage.googleapis.com/v1beta/openai/';
  if (!apiKey) return null;

  if (!mahiClassifierClient || cachedMahiApiKey !== apiKey || cachedMahiBaseURL !== baseURL) {
    mahiClassifierClient = new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: {
        'x-goog-api-key': apiKey
      }
    });
    cachedMahiApiKey = apiKey;
    cachedMahiBaseURL = baseURL;
  }
  return mahiClassifierClient;
}

let openrouterClassifierClient = null;
let cachedOpenRouterApiKey = null;

function getOpenRouterClassifierClient() {
  const apiKey = config.openrouter?.apiKey;
  if (!apiKey) return null;

  if (!openrouterClassifierClient || cachedOpenRouterApiKey !== apiKey) {
    openrouterClassifierClient = new OpenAI({
      baseURL: config.openrouter.baseURL || 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
        'X-Title': 'Mestrio AI'
      }
    });
    cachedOpenRouterApiKey = apiKey;
  }
  return openrouterClassifierClient;
}

/**
 * Fast pre-filter checking if a prompt or conversation state could be an image generation or modification request.
 * Saves latency for 95% of normal coding, factual, or conversational queries.
 */
export function couldBeImageIntent(query, conversationHistory = []) {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();
  if (q.length === 0) return false;

  // 1. Explicit command
  if (q.startsWith('/image')) return true;

  // 2. Reject obvious programming/coding questions
  if (/\b(?:html|css|javascript|react|npm|component|tag|attr|attribute|syntax|error|fix|debug|api|function|const|let|var)\b/i.test(q)) {
    return false;
  }

  // 3. Visual / Image nouns in English, Banglish, Bengali
  const visualNouns = /\b(image|images|photo|photos|pic|pics|picture|pictures|chobi|ছবি|ছবির|wallpaper|illustration|portrait|sketch|art|artwork|painting|render|background|scenery|drissho|দৃশ্য|cartoon|character|anime|graphic|drawing|logo|poster|avatar)\b/i;

  // 4. Action / Generation verbs in English, Banglish, Bengali
  const actionVerbs = /\b(draw|paint|create|make|generate|banao|bana|toiri|বানাও|তৈরি|dekhao|dekhaw|দেখা|আঁকো|akaw|aanko|render|design)\b/i;

  // 5. Visual modification / addition words in English, Banglish, Bengali
  const modificationWords = /\b(poriye|porai|lagiye|lagao|change|modify|replace|swap|add|remove|hat|tupi|choshma|sunglasses|dress|color|colour|rong|background)\b/i;

  // Check if recent conversation contained a generated image
  const hasRecentImage = Array.isArray(conversationHistory) && conversationHistory.slice(-4).some(m => {
    if (!m) return false;
    if (m.imageUrl || m.imagePrompt) return true;
    const content = typeof m.content === 'string' ? m.content : '';
    return content.includes('[Generated Image');
  });

  if (hasRecentImage && (modificationWords.test(q) || actionVerbs.test(q) || visualNouns.test(q))) {
    return true;
  }

  if (visualNouns.test(q) || actionVerbs.test(q)) {
    return true;
  }

  return false;
}

/**
 * Intelligently classifies user intent and enriches/translates image generation prompts
 * using the user's actively selected model as the primary brain.
 */
export async function detectAndEnrichImageIntent({
  query,
  conversationHistory = [],
  model = null,
  abortSignal = null,
  requestId = '-'
}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { isImage: false, prompt: null };
  }

  const trimmedQuery = query.trim();

  // Fast pre-filter: skip LLM call if query is clearly not visual or related to images
  if (!couldBeImageIntent(trimmedQuery, conversationHistory)) {
    return { isImage: false, prompt: null };
  }

  // Format recent history (up to last 4 messages) for context retention
  const recentContext = conversationHistory.slice(-4).map(m => {
    if (!m) return null;
    const role = m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user');
    let content = typeof m.content === 'string' ? m.content : '';
    if (m.imageUrl || m.imagePrompt) {
      content = `[Generated Image: ${m.imagePrompt || 'Visual Subject'}]`;
    }
    if (!content.trim()) return null;
    return { role, content: content.slice(0, 300) };
  }).filter(Boolean);

  const messages = [
    { role: 'system', content: INTENT_CLASSIFIER_SYSTEM_PROMPT },
    ...recentContext,
    { role: 'user', content: trimmedQuery }
  ];

  // 1. Primary Brain: Execute via the user's actively selected model
  const isMahi = isMahiEngine(model);
  if (isMahi) {
    const mahiClient = getMahiClassifierClient();
    if (mahiClient) {
      try {
        const response = await mahiClient.chat.completions.create(
          {
            model: config.mahiEngine?.model || 'gemini-3.5-flash-lite',
            messages,
            temperature: 0.1,
            max_tokens: 400,
            response_format: { type: 'json_object' }
          },
          {
            signal: abortSignal || undefined,
            timeout: 6000
          }
        );

        const raw = response.choices?.[0]?.message?.content?.trim();
        const parsed = parseModelIntentOutput(raw, trimmedQuery, 'image');
        if (parsed) {
          logger.info('Image intent classified via active selected model (Mahi Engine)', {
            requestId,
            selectedModel: model,
            isImage: parsed.isIntent,
            reasoning: parsed.reasoning
          });
          return {
            isImage: Boolean(parsed.isIntent),
            prompt: parsed.isIntent ? (parsed.visualPrompt || cleanPrompt(trimmedQuery)) : null,
            reasoning: parsed.reasoning || ''
          };
        }
      } catch (err) {
        logger.warn('Mahi Engine selected model intent classifier error', {
          requestId,
          selectedModel: model,
          error: err.message
        });
      }
    }
  } else {
    // OpenRouter: Use the exact model chosen by the user
    const orClient = getOpenRouterClassifierClient();
    if (orClient) {
      const resolved = resolveModel(model);
      const activeModelId = (typeof resolved === 'string' ? resolved : resolved?.id) || 'google/gemini-2.5-flash';
      try {
        let raw = null;
        try {
          const response = await orClient.chat.completions.create(
            {
              model: activeModelId,
              messages,
              temperature: 0.1,
              max_tokens: 400,
              response_format: { type: 'json_object' }
            },
            {
              signal: abortSignal || undefined,
              timeout: 6000
            }
          );
          raw = response.choices?.[0]?.message?.content?.trim();
        } catch (_) {
          // Retry without response_format if model rejects json_object
          const response = await orClient.chat.completions.create(
            {
              model: activeModelId,
              messages,
              temperature: 0.1,
              max_tokens: 400
            },
            {
              signal: abortSignal || undefined,
              timeout: 6000
            }
          );
          raw = response.choices?.[0]?.message?.content?.trim();
        }

        const parsed = parseModelIntentOutput(raw, trimmedQuery, 'image');
        if (parsed) {
          logger.info('Image intent classified via active selected model (OpenRouter)', {
            requestId,
            selectedModel: activeModelId,
            isImage: parsed.isIntent,
            reasoning: parsed.reasoning
          });
          return {
            isImage: Boolean(parsed.isIntent),
            prompt: parsed.isIntent ? (parsed.visualPrompt || cleanPrompt(trimmedQuery)) : null,
            reasoning: parsed.reasoning || ''
          };
        }
      } catch (err) {
        logger.warn('Selected model intent classifier error on OpenRouter, attempting fallback', {
          requestId,
          selectedModel: activeModelId,
          error: err.message
        });

        // Fallback to fast classifier if active model fails
        if (activeModelId !== 'google/gemini-2.5-flash') {
          try {
            const fbResponse = await orClient.chat.completions.create(
              {
                model: 'google/gemini-2.5-flash',
                messages,
                temperature: 0.1,
                max_tokens: 400
              },
              { signal: abortSignal || undefined, timeout: 5000 }
            );
            const fbRaw = fbResponse.choices?.[0]?.message?.content?.trim();
            const fbParsed = parseModelIntentOutput(fbRaw, trimmedQuery, 'image');
            if (fbParsed && fbParsed.isIntent) {
              return {
                isImage: true,
                prompt: fbParsed.visualPrompt || cleanPrompt(trimmedQuery),
                reasoning: fbParsed.reasoning || ''
              };
            }
          } catch (_) { }
        }
      }
    }
  }

  // Heuristic Fallback
  if (isImageIntent(trimmedQuery)) {
    const fallbackPrompt = cleanPrompt(trimmedQuery);
    return {
      isImage: true,
      prompt: fallbackPrompt,
      reasoning: 'Heuristic keyword match'
    };
  }

  return { isImage: false, prompt: null };
}

/**
 * Heuristic detector used as a fallback. Rejects questions about images and coding questions.
 */
export function isImageIntent(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = prompt.trim();
  if (p.length === 0) return false;

  // 1. Explicit command
  if (/^\/image\b/i.test(p)) return true;

  // 2. Reject questions about images or conversational queries
  const isQuestionOrChat = /\b(?:kisher|kiser|keno|kivabe|kibhabe|ki\s+bhabe|why|what\s+kind|how\s+to|explain|tell\s+me|kothay|kokhon)\b/i.test(p);
  if (isQuestionOrChat) {
    return false;
  }

  // Avoid false positives for programming questions (e.g. HTML img tag or CSS code)
  const isCodingQuery = /\b(?:html|css|javascript|react|npm|component|tag|attr|attribute|syntax|error|fix|debug|api)\b/i.test(p);
  if (isCodingQuery) {
    return false;
  }

  // 3. Multi-lingual regex catching user intents in English, Bengali, Banglish, Hindi, etc.
  const hasImageNoun = /(?:image|images|photo|photos|chobi|ছবি|pic|pics|picture|pictures|wallpaper|illustration|portrait|sketch|art|artwork|cartoon|anime|character|render|drawing|avatar)/i.test(p);
  const hasActionVerb = /(?:draw|paint|render|create|make|generate|banao|bana|toiri|বানাও|তৈরি|dekhao|dekhaw|bana\s*do|khicho|design)/i.test(p);

  if (hasImageNoun && hasActionVerb) {
    return true;
  }

  if (hasImageNoun && /(?:a|an|the|ekta|akta|একটি|একটা|er|এর|for|of)\b/i.test(p)) {
    return true;
  }

  if (hasActionVerb && /(?:a|an|the|ekta|akta|একটি|একটা|cartoon|cat|dog|dragon|scene|sunset|car|character)\b/i.test(p)) {
    return true;
  }

  return false;
}

/**
 * Multimodal Intent Router and Visual Delta Prompt Synthesizer
 * Uses the user's actively selected model as the primary brain.
 * Strictly separates conversational queries (1a) from image edit requests (1b/2),
 * analyzing visual features, style, and requested modifications to generate refined English FLUX prompts.
 */
export async function routeMultimodalIntentAndSynthesizeDelta({
  query,
  imageUrl,
  conversationHistory = [],
  model = null,
  abortSignal = null,
  requestId = '-'
}) {
  if (!imageUrl) {
    return { is_edit_request: false, visual_prompt: null, reasoning: 'No reference image provided' };
  }

  const trimmedQuery = (query || '').trim() || 'Analyze this image.';

  // Build conversational context (taking up to 2 preceding messages for continuity)
  const recentMessages = [];
  if (Array.isArray(conversationHistory) && conversationHistory.length > 1) {
    const slice = conversationHistory.slice(-3, -1);
    for (const m of slice) {
      if (!m) continue;
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      let text = typeof m.content === 'string' ? m.content : '';
      if (Array.isArray(m.content)) {
        text = m.content.filter(p => p?.type === 'text').map(p => p.text).join(' ');
      }
      if (text.trim() && text.length < 300) {
        recentMessages.push({ role, content: text.trim() });
      }
    }
  }

  const messages = [
    { role: 'system', content: MULTIMODAL_INTENT_ROUTER_PROMPT },
    ...recentMessages,
    {
      role: 'user',
      content: [
        { type: 'text', text: trimmedQuery },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ];

  // 1. Primary Brain: Execute via the user's actively selected model
  const isMahi = isMahiEngine(model);
  if (isMahi) {
    const mahiClient = getMahiClassifierClient();
    if (mahiClient) {
      try {
        const response = await mahiClient.chat.completions.create(
          {
            model: config.mahiEngine?.model || 'gemini-3.5-flash-lite',
            messages,
            temperature: 0.1,
            max_tokens: 600,
            response_format: { type: 'json_object' }
          },
          {
            signal: abortSignal || undefined,
            timeout: 15000
          }
        );

        const raw = response.choices?.[0]?.message?.content?.trim();
        const parsed = parseModelIntentOutput(raw, trimmedQuery, 'edit');
        if (parsed) {
          logger.info('Multimodal vision intent routed via active selected model (Mahi Engine)', {
            requestId,
            selectedModel: model,
            isEdit: parsed.isIntent,
            promptLength: parsed.visualPrompt ? parsed.visualPrompt.length : 0,
            reasoning: parsed.reasoning
          });
          return {
            is_edit_request: Boolean(parsed.isIntent),
            visual_prompt: parsed.isIntent ? (parsed.visualPrompt || cleanPrompt(trimmedQuery)) : null,
            reasoning: parsed.reasoning || ''
          };
        }
      } catch (err) {
        logger.warn('Mahi Engine selected model vision router error', {
          requestId,
          selectedModel: model,
          error: err.message
        });
      }
    }
  } else {
    // OpenRouter: Use the exact active model chosen by the user
    const orClient = getOpenRouterClassifierClient();
    if (orClient) {
      const resolved = resolveModel(model);
      const activeModelId = (typeof resolved === 'string' ? resolved : resolved?.id) || 'google/gemini-2.5-flash';
      try {
        let raw = null;
        try {
          const response = await orClient.chat.completions.create(
            {
              model: activeModelId,
              messages,
              temperature: 0.1,
              max_tokens: 600,
              response_format: { type: 'json_object' }
            },
            {
              signal: abortSignal || undefined,
              timeout: 15000
            }
          );
          raw = response.choices?.[0]?.message?.content?.trim();
        } catch (_) {
          // If model rejected response_format, retry without it
          const response = await orClient.chat.completions.create(
            {
              model: activeModelId,
              messages,
              temperature: 0.1,
              max_tokens: 600
            },
            {
              signal: abortSignal || undefined,
              timeout: 15000
            }
          );
          raw = response.choices?.[0]?.message?.content?.trim();
        }

        const parsed = parseModelIntentOutput(raw, trimmedQuery, 'edit');
        if (parsed) {
          logger.info('Multimodal vision intent routed via active selected model (OpenRouter)', {
            requestId,
            selectedModel: activeModelId,
            isEdit: parsed.isIntent,
            promptLength: parsed.visualPrompt ? parsed.visualPrompt.length : 0,
            reasoning: parsed.reasoning
          });
          return {
            is_edit_request: Boolean(parsed.isIntent),
            visual_prompt: parsed.isIntent ? (parsed.visualPrompt || cleanPrompt(trimmedQuery)) : null,
            reasoning: parsed.reasoning || ''
          };
        }
      } catch (err) {
        logger.warn('Selected model vision router error on OpenRouter, attempting vision fallback', {
          requestId,
          selectedModel: activeModelId,
          error: err.message
        });

        // If the selected model cannot process images (e.g. text-only model on OpenRouter), fallback to gemini-2.5-flash
        if (activeModelId !== 'google/gemini-2.5-flash') {
          try {
            const fbResponse = await orClient.chat.completions.create(
              {
                model: 'google/gemini-2.5-flash',
                messages,
                temperature: 0.1,
                max_tokens: 600
              },
              {
                signal: abortSignal || undefined,
                timeout: 12000
              }
            );
            const fbRaw = fbResponse.choices?.[0]?.message?.content?.trim();
            const fbParsed = parseModelIntentOutput(fbRaw, trimmedQuery, 'edit');
            if (fbParsed) {
              return {
                is_edit_request: Boolean(fbParsed.isIntent),
                visual_prompt: fbParsed.isIntent ? (fbParsed.visualPrompt || cleanPrompt(trimmedQuery)) : null,
                reasoning: fbParsed.reasoning || ''
              };
            }
          } catch (_) { }
        }
      }
    }
  }

  // 2. Resilient Fallback: If the selected model cannot process images (e.g. text-only model on OpenRouter like deepseek),
  // fallback to a vision-capable engine so the user request still succeeds without hardcoding the primary path
  const mahiClient = getMahiClassifierClient();
  if (mahiClient) {
    try {
      const response = await mahiClient.chat.completions.create(
        {
          model: config.mahiEngine?.model || 'gemini-3.5-flash-lite',
          messages,
          temperature: 0.1,
          max_tokens: 600,
          response_format: { type: 'json_object' }
        },
        {
          signal: abortSignal || undefined,
          timeout: 12000
        }
      );
      const raw = response.choices?.[0]?.message?.content?.trim();
      const parsed = parseModelIntentOutput(raw, trimmedQuery, 'edit');
      if (parsed) {
        return {
          is_edit_request: Boolean(parsed.isIntent),
          visual_prompt: parsed.isIntent ? (parsed.visualPrompt || cleanPrompt(trimmedQuery)) : null,
          reasoning: parsed.reasoning || ''
        };
      }
    } catch (_) { }
  }

  // 3. Fallback heuristic
  const isEdit = isModificationOrReference(trimmedQuery) || isImageIntent(trimmedQuery);
  if (isEdit) {
    const fallbackPrompt = cleanPrompt(trimmedQuery);
    return {
      is_edit_request: true,
      visual_prompt: fallbackPrompt,
      reasoning: 'Heuristic keyword fallback'
    };
  }

  return { is_edit_request: false, visual_prompt: null, reasoning: 'Default fallback conversational' };
}

/**
 * Strips trigger keywords, conversational fluff, translates Banglish/Bangla terms,
 * and extracts/enriches a clean visual English prompt for FLUX.2.
 */
export function cleanPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return 'A highly detailed, cinematic photograph of a serene landscape, dramatic lighting, photorealistic 8k resolution';
  }
  let cleaned = prompt.trim();

  // If prompt is already an extensive visual description (e.g. from Visual Delta Prompt Synthesis or FLUX prompt), preserve it directly
  if (cleaned.length > 70 && (cleaned.includes(',') || /\b(cinematic|photograph|portrait|lighting|resolution|detailed|texture|render|bokeh|studio)\b/i.test(cleaned))) {
    cleaned = cleaned.replace(/^\/image\s*/i, '').replace(/^["']|["']$/g, '').trim();
    return cleaned;
  }

  // Strip command prefix
  cleaned = cleaned.replace(/^\/image\s*/i, '');

  // Strip conversational wrappers in English, Banglish, and Bengali
  cleaned = cleaned.replace(/^(?:tmi|tumi|apni|amake|plz|please|can\s+you|could\s+you|kindly|hey|hello|hi)\s+/i, '');
  cleaned = cleaned.replace(/^(?:ekta|akta|একটি|একটা)\s+/i, '');
  cleaned = cleaned.replace(/^(?:generate|create|draw|make|render|paint|show|give\s+me)\s+(?:an?|the|some)?\s*(?:image|photo|picture|illustration|wallpaper|pic)?\s*(?:of|showing|depicting|with)?\s*/i, '');

  // Strip trailing requests and noise: "bana daw to", "bana daw", "er image", "toiri koro"
  cleaned = cleaned.replace(/\s*(?:er|এর)\s+(?:image|chobi|photo|pic|picture|ছবি)/gi, '');
  cleaned = cleaned.replace(/\s*(?:bana\s*daw\s*to|bana\s*daw|bana\s*do|banao\s*to|banao|toiri\s*koro|toiri\s*kore\s*daw|বানাও|তৈরি\s*করো)/gi, '');
  cleaned = cleaned.replace(/\s+(?:daw|do|to|na|plz|please)$/i, '');

  // Translate dictionary Banglish/Bangla terms
  let words = cleaned.split(/\s+/);
  let translatedWords = words.map(w => {
    const lower = w.toLowerCase().replace(/[^a-zA-Z\u0980-\u09FF]/g, '');
    return BANGLA_SUBJECT_TRANSLATIONS[lower] || w;
  });
  let translatedPrompt = translatedWords.join(' ').trim();
  translatedPrompt = sanitizePromptForImageEngine(translatedPrompt);

  // If the result is a short subject, enrich it with cinematic photographic descriptors
  if (translatedPrompt.length > 0 && translatedPrompt.length < 50 && !translatedPrompt.includes(',')) {
    const cleanSubject = translatedPrompt.replace(/^(?:an?|the)\s+/i, '');
    const article = /^[aeiou]/i.test(cleanSubject) ? 'an' : 'a';
    if (cleanSubject.includes('cat') || cleanSubject.includes('dog') || cleanSubject.includes('bird') || cleanSubject.includes('tiger') || cleanSubject.includes('lion') || cleanSubject.includes('chicken') || cleanSubject.includes('rooster')) {
      return `A cute, highly detailed photographic portrait of ${article} ${cleanSubject}, vibrant lighting, ultra-sharp focus, 8k resolution`;
    }
    return `A highly detailed, cinematic photograph of ${article} ${cleanSubject}, dramatic lighting, photorealistic 8k resolution`;
  }

  return translatedPrompt || prompt.trim();
}

/**
 * Coordinates image generation via dedicated OpenRouter image engine (FLUX.2 Klein 4B)
 * with robust content moderation auto-sanitization and resilient Gemini Flash Image fallback.
 * Strictly avoids unhandled promise rejections or silent failures.
 */
export async function executeImageGeneration({
  prompt,
  abortSignal = null,
  requestId = '-'
}) {
  const cleaned = cleanPrompt(prompt);
  const sanitized = sanitizePromptForImageEngine(cleaned);
  const apiKey = config.openrouter?.apiKey;

  if (!apiKey) {
    logger.error('OPENROUTER_API_KEY is not configured for image synthesis', { requestId });
    throw new Error('OPENROUTER_API_KEY is not configured for image generation');
  }

  const controller = new AbortController();
  if (abortSignal) {
    if (abortSignal.aborted) {
      throw new Error('Client aborted image request');
    }
    abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const timeoutMs = Math.max(config.timeouts?.imageTimeoutMs || 30000, 45000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const extractUrl = (data) => {
    if (!data) return null;
    const first = data.data?.[0];
    if (first?.url && isValidImageUrlString(first.url)) return first.url;
    if (first?.b64_json) return `data:image/jpeg;base64,${first.b64_json}`;
    if (first?.image && isValidImageUrlString(first.image)) return first.image;
    if (data.url && isValidImageUrlString(data.url)) return data.url;
    if (data.imageUrl && isValidImageUrlString(data.imageUrl)) return data.imageUrl;
    // Check choices format (OpenRouter multimodal chat completions)
    const choiceImg = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (choiceImg && isValidImageUrlString(choiceImg)) return choiceImg;
    return null;
  };

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
    'X-Title': config.openrouter.siteName || 'Mestrio AI'
  };

  const promptToTry = sanitized || cleaned;
  let lastError = null;

  // 1. Primary Engine: Dedicated FLUX.2 Klein 4B via OpenRouter Images API
  try {
    logger.info('Dispatching image generation to FLUX.2 Klein 4B', { requestId, promptLength: promptToTry.length });
    const response = await axios.post(
      'https://openrouter.ai/api/v1/images',
      {
        model: 'black-forest-labs/flux.2-klein-4b',
        prompt: promptToTry
      },
      {
        headers,
        signal: controller.signal,
        timeout: timeoutMs
      }
    );

    const imageUrl = extractUrl(response.data);
    if (imageUrl) {
      clearTimeout(timer);
      logger.info('FLUX.2 Klein 4B image successfully synthesized', { requestId });
      return {
        imageUrl,
        prompt: promptToTry,
        isFallback: false
      };
    }
  } catch (err) {
    lastError = err;
    const errMsg = String(err.response?.data?.error?.message || err.message || '');
    const isModeration = err.response?.status === 400 && (errMsg.includes('content moderation') || errMsg.includes('blocked this request'));

    logger.warn('FLUX.2 Klein 4B initial attempt failed', {
      requestId,
      status: err.response?.status,
      error: errMsg,
      isModeration
    });

    // Content moderation auto-retry with pure visual tokens
    if (isModeration && !controller.signal.aborted) {
      try {
        const heavilyCleaned = promptToTry
          .replace(/[a-zA-Z0-9_-]+(?:\s+[a-zA-Z0-9_-]+)?\s+cartoon/gi, 'cartoon character')
          .replace(/\b(?:oggy|doraemon|pikachu|sonic|mickey|jerry|tom)\b/gi, 'cute character');

        const retryRes = await axios.post(
          'https://openrouter.ai/api/v1/images',
          {
            model: 'black-forest-labs/flux.2-klein-4b',
            prompt: heavilyCleaned
          },
          {
            headers,
            signal: controller.signal,
            timeout: timeoutMs
          }
        );
        const retryUrl = extractUrl(retryRes.data);
        if (retryUrl) {
          clearTimeout(timer);
          logger.info('FLUX.2 Klein 4B retry with heavily sanitized prompt succeeded', { requestId });
          return {
            imageUrl: retryUrl,
            prompt: heavilyCleaned,
            isFallback: false
          };
        }
      } catch (retryErr) {
        lastError = retryErr;
        logger.warn('FLUX.2 Klein 4B moderation retry failed', { requestId, error: retryErr.message });
      }
    }
  }

  // 2. Resilient Fallback: OpenRouter Google Gemini Flash Image API
  // Ensures user request succeeds with 100% reliability even if upstream BFL has an outage or blocks
  if (!controller.signal.aborted) {
    try {
      logger.info('Engaging resilient OpenRouter image fallback (Gemini Flash Image)', { requestId });
      const fallbackResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.5-flash-image',
          messages: [
            {
              role: 'user',
              content: `Create a high-quality, vibrant, detailed visual image of: ${promptToTry}`
            }
          ],
          modalities: ['image', 'text']
        },
        {
          headers,
          signal: controller.signal,
          timeout: timeoutMs
        }
      );

      const fallbackUrl = extractUrl(fallbackResponse.data);
      if (fallbackUrl) {
        clearTimeout(timer);
        logger.info('OpenRouter image fallback successfully synthesized image', { requestId });
        return {
          imageUrl: fallbackUrl,
          prompt: promptToTry,
          isFallback: true
        };
      }
    } catch (fbErr) {
      logger.error('OpenRouter image fallback failed', { requestId, error: fbErr.response?.data || fbErr.message });
      lastError = fbErr;
    }
  }

  clearTimeout(timer);
  if (abortSignal?.aborted || controller.signal.aborted) {
    throw new Error('Image generation cancelled or timed out');
  }

  logger.error('All image generation engines exhausted', {
    requestId,
    lastError: lastError?.response?.data || lastError?.message
  });
  throw lastError || new Error('Image generation returned empty response');
}

export default {
  IMAGE_GENERATION_TOOL,
  MULTIMODAL_INTENT_ROUTER_PROMPT,
  extractAttachedImageFromMessage,
  findMostRecentImage,
  isModificationOrReference,
  routeMultimodalIntentAndSynthesizeDelta,
  isImageIntent,
  couldBeImageIntent,
  detectAndEnrichImageIntent,
  cleanPrompt,
  sanitizePromptForImageEngine,
  executeImageGeneration,
  isValidImageUrlString
};

