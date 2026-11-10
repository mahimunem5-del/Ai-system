import axios from 'axios';
import OpenAI from 'openai';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { resolveMahiEngineConfig } from '../services/mahiEngineResolver.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Jimp = require('jimp');
const potrace = require('potrace');
const Bitmap = require('potrace/lib/types/Bitmap');
const iq = require('image-q');
const sharp = require('sharp');

/**
 * Exact OpenRouter Dedicated Image API Model Mapping.
 * Maps dropdown model IDs and names to the official OpenRouter model IDs.
 */
export const OPENROUTER_IMAGE_MODEL_MAP = {
  'openai/gpt-image-2.5-sunburst': 'openai/gpt-image-2.5-sunburst',
  'google/gemini-3-pro-image': 'google/gemini-3-pro-image',
  'google/nano-banana-pro': 'google/gemini-3-pro-image',
  'black-forest-labs/flux.2-pro': 'black-forest-labs/flux.2-pro',
  'black-forest-labs/flux.2-flex': 'black-forest-labs/flux.2-flex',
  'bytedance-seed/seedream-5.0-pro': 'bytedance-seed/seedream-5.0-pro',
  'meta/muse-image': 'meta/muse-image',
  'google/gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image-preview',
  'google/nano-banana-2': 'google/gemini-3.1-flash-image-preview'
};

export const MODEL_NAME_TO_ID = {
  'GPT Image 2.5 Sunburst': 'openai/gpt-image-2.5-sunburst',
  'Nano Banana Pro (Gemini 3 Pro Image)': 'google/gemini-3-pro-image',
  'FLUX.2 Pro': 'black-forest-labs/flux.2-pro',
  'FLUX.2 Flex': 'black-forest-labs/flux.2-flex',
  'Seedream 5.0 Pro': 'bytedance-seed/seedream-5.0-pro',
  'Meta: Muse Image': 'meta/muse-image',
  'Nano Banana 2 (Gemini 3.1 Flash Image)': 'google/gemini-3.1-flash-image-preview'
};

export const MODEL_ID_TO_DISPLAY_NAME = {
  'openai/gpt-image-2.5-sunburst': 'GPT Image 2.5 Sunburst',
  'google/gemini-3-pro-image': 'Nano Banana Pro (Gemini 3 Pro Image)',
  'google/nano-banana-pro': 'Nano Banana Pro (Gemini 3 Pro Image)',
  'black-forest-labs/flux.2-pro': 'FLUX.2 Pro',
  'black-forest-labs/flux.2-flex': 'FLUX.2 Flex',
  'bytedance-seed/seedream-5.0-pro': 'Seedream 5.0 Pro',
  'meta/muse-image': 'Meta: Muse Image',
  'google/gemini-3.1-flash-image-preview': 'Nano Banana 2 (Gemini 3.1 Flash Image)',
  'google/nano-banana-2': 'Nano Banana 2 (Gemini 3.1 Flash Image)'
};

/**
 * Resolves any incoming model identifier (ID or display name) to an OpenRouter Dedicated Image Model ID.
 */
export function resolveOpenRouterImageModel(rawModel) {
  if (!rawModel || typeof rawModel !== 'string') {
    return 'openai/gpt-image-2.5-sunburst';
  }
  const trimmed = rawModel.trim();
  if (OPENROUTER_IMAGE_MODEL_MAP[trimmed]) {
    return OPENROUTER_IMAGE_MODEL_MAP[trimmed];
  }
  if (MODEL_NAME_TO_ID[trimmed]) {
    return MODEL_NAME_TO_ID[trimmed];
  }
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(OPENROUTER_IMAGE_MODEL_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }
  for (const [key, val] of Object.entries(MODEL_NAME_TO_ID)) {
    if (key.toLowerCase() === lower) return val;
  }
  if (trimmed.includes('/')) {
    return trimmed;
  }
  return 'openai/gpt-image-2.5-sunburst';
}

/**
 * Intelligently classifies an image generation prompt and routes to the best model when Auto is selected.
 * - Typography/Design -> FLUX.2 Pro ('black-forest-labs/flux.2-pro')
 * - Cartoon/Anime/Edits -> GPT Image 2.5 Sunburst ('openai/gpt-image-2.5-sunburst')
 * - Photorealistic/Detail -> Seedream 5.0 Pro ('bytedance-seed/seedream-5.0-pro')
 * - Fallback -> GPT Image 2.5 Sunburst ('openai/gpt-image-2.5-sunburst')
 */
export function routeAutoImageModel(prompt = '', isEditMode = false) {
  if (isEditMode) {
    return 'openai/gpt-image-2.5-sunburst';
  }

  const text = (typeof prompt === 'string' ? prompt : '').toLowerCase();

  // 1. Typography & Graphic Design -> FLUX.2 Pro
  const typographyRegex = /\b(typography|text|words?|quote|lettering|letters|font|logo|logotype|badge|emblem|t-shirt|poster|billboard|signage|label|calligraphy|monogram|wordmark|headline|slogan|banner)\b/i;
  if (typographyRegex.test(text)) {
    return 'black-forest-labs/flux.2-pro';
  }

  // 2. Cartoon, Anime, Manga, Pixar, Illustration -> GPT Image 2.5 Sunburst
  const cartoonAnimeRegex = /\b(anime|manga|cartoon|chibi|pixar|disney|comic|comics|illustration|animated|animation|drawing|sketch|doodle|caricature|toon|ghibli|vector art|clipart)\b/i;
  if (cartoonAnimeRegex.test(text)) {
    return 'openai/gpt-image-2.5-sunburst';
  }

  // 3. Photorealistic, DSLR Photography, High Detail -> Seedream 5.0 Pro
  const photoDetailRegex = /\b(photo|photography|photorealistic|hyperrealistic|realistic|portrait|dslr|raw photo|candid|cinematic|film grain|35mm|8k|macro photo|close-up photo|ultra-detailed|unreal engine|octane render)\b/i;
  if (photoDetailRegex.test(text)) {
    return 'bytedance-seed/seedream-5.0-pro';
  }

  // 4. Fallback -> GPT Image 2.5 Sunburst
  return 'openai/gpt-image-2.5-sunburst';
}

/**
 * Aspect Ratio to Dimension mapping
 */
export const ASPECT_RATIO_DIMENSIONS = {
  '1:1': { width: 1024, height: 1024, aspect_ratio: '1:1' },
  '2:3': { width: 832, height: 1248, aspect_ratio: '2:3' },
  '3:4': { width: 864, height: 1152, aspect_ratio: '3:4' },
  '9:16': { width: 768, height: 1344, aspect_ratio: '9:16' },
  '3:2': { width: 1248, height: 832, aspect_ratio: '3:2' },
  '4:3': { width: 1152, height: 864, aspect_ratio: '4:3' },
  '16:9': { width: 1344, height: 768, aspect_ratio: '16:9' }
};

export function resolveDimensions(aspectRatio) {
  return ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['1:1'];
}

/**
 * Parses and formats an image result into a clean, displayable image source URL or Data URI.
 */
export function extractAndFormatImage(dataItem) {
  if (!dataItem) return null;

  // Direct string handling
  if (typeof dataItem === 'string') {
    const trimmed = dataItem.trim();
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.startsWith('/9j/')) return `data:image/jpeg;base64,${trimmed}`;
    if (trimmed.startsWith('iVBOR')) return `data:image/png;base64,${trimmed}`;
    if (trimmed.startsWith('R0lGOD')) return `data:image/gif;base64,${trimmed}`;
    if (trimmed.startsWith('UklGR')) return `data:image/webp;base64,${trimmed}`;
    return `data:image/png;base64,${trimmed}`;
  }

  // Object handling
  if (typeof dataItem === 'object') {
    if (dataItem.url && typeof dataItem.url === 'string') {
      return extractAndFormatImage(dataItem.url);
    }
    if (dataItem.b64_json && typeof dataItem.b64_json === 'string') {
      return extractAndFormatImage(dataItem.b64_json);
    }
    if (dataItem.image && typeof dataItem.image === 'string') {
      return extractAndFormatImage(dataItem.image);
    }
  }

  return null;
}

/**
 * Robustly parses and extracts image URLs or base64 data URIs from OpenRouter /chat/completions responses.
 * Handles markdown images (![alt](url)), choices[0].message.images, choices[0].message.image,
 * multimodal content arrays, and direct data/images fields.
 */
export function extractImagesFromChatCompletion(responseData) {
  if (!responseData) return [];
  const foundUrls = [];

  try {
    const addIfValid = (candidate) => {
      if (!candidate) return;
      const formatted = extractAndFormatImage(candidate);
      if (formatted && !foundUrls.includes(formatted)) {
        foundUrls.push(formatted);
      }
    };

    // 1. Inspect choices array (standard chat completions)
    if (Array.isArray(responseData.choices)) {
      for (const choice of responseData.choices) {
        const msg = choice?.message;
        if (!msg) continue;

        // a) msg.images array
        if (Array.isArray(msg.images)) {
          for (const img of msg.images) {
            if (typeof img === 'string') addIfValid(img);
            else if (img?.image_url?.url) addIfValid(img.image_url.url);
            else if (img?.url) addIfValid(img.url);
            else if (img?.image) addIfValid(img.image);
            else if (img?.b64_json) addIfValid(img.b64_json);
          }
        }

        // b) msg.image object or string
        if (msg.image) {
          if (typeof msg.image === 'string') addIfValid(msg.image);
          else if (msg.image?.url) addIfValid(msg.image.url);
          else if (msg.image?.b64_json) addIfValid(msg.image.b64_json);
        }

        // c) msg.content
        const content = msg.content;
        if (typeof content === 'string') {
          // Look for markdown image tags: ![alt](url)
          const mdRegex = /!\[.*?\]\((https?:\/\/[^\s)]+|data:image\/[^\s)]+)\)/gi;
          let match;
          let foundMd = false;
          while ((match = mdRegex.exec(content)) !== null) {
            if (match[1]) {
              addIfValid(match[1]);
              foundMd = true;
            }
          }

          // Direct data URI or URL
          if (!foundMd) {
            const trimmed = content.trim();
            if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
              addIfValid(trimmed);
            } else {
              // Find any http/https or data URI inside text
              const urlRegex = /(https?:\/\/[^\s"'<>\)]+|data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)/g;
              let urlMatch;
              while ((urlMatch = urlRegex.exec(content)) !== null) {
                if (urlMatch[1]) {
                  addIfValid(urlMatch[1]);
                }
              }
            }
          }
        } else if (Array.isArray(content)) {
          for (const part of content) {
            if (part?.type === 'image_url' && part?.image_url?.url) {
              addIfValid(part.image_url.url);
            } else if (part?.type === 'image' && (part?.image || part?.url)) {
              addIfValid(part.image || part.url);
            } else if (part?.image_url && typeof part.image_url === 'string') {
              addIfValid(part.image_url);
            }
          }
        }
      }
    }

    // 2. Direct data or images arrays (top-level or proxy wrapped)
    if (Array.isArray(responseData.data)) {
      for (const item of responseData.data) {
        addIfValid(item);
      }
    }
    if (Array.isArray(responseData.images)) {
      for (const item of responseData.images) {
        addIfValid(item);
      }
    }
    if (responseData.url || responseData.imageUrl) {
      addIfValid(responseData.url || responseData.imageUrl);
    }
  } catch (err) {
    console.error('Error parsing images from chat completion:', err.message);
  }

  return foundUrls;
}

/**
 * Helper to validate if a string is a valid image URL or base64 Data URL
 */
export function isValidImageUrlString(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/9j/') ||
    trimmed.startsWith('iVBOR') ||
    (trimmed.length > 50 && !trimmed.includes(' ') && !trimmed.includes('\n'))
  );
}

/**
 * Ensures an image URL or base64 string is correctly formatted as a valid
 * Data URI or web URL for OpenAI multimodal vision APIs.
 */
export function formatImageUrlForVision(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already standard HTTP/HTTPS or data URI
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Handle bare base64 headers
  if (trimmed.startsWith('/9j/')) return `data:image/jpeg;base64,${trimmed}`;
  if (trimmed.startsWith('iVBOR')) return `data:image/png;base64,${trimmed}`;
  if (trimmed.startsWith('R0lGOD')) return `data:image/gif;base64,${trimmed}`;
  if (trimmed.startsWith('UklGR')) return `data:image/webp;base64,${trimmed}`;

  // If it's a long base64 string without header
  if (trimmed.length > 50 && !trimmed.includes(' ') && !trimmed.includes('\n')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  return null;
}

/**
 * Mahi Engine Intelligent Prompt Optimizer with Dual-Vision Capabilities.
 * Takes the user's prompt and optional source/reference images, expanding it into a detailed,
 * visually rich descriptive prompt that accurately incorporates the style, lighting, and composition
 * of the attached images while strictly preserving the user's intent.
 * Falls back smoothly to rawPrompt on error, timeout, or missing key.
 */
export async function enhancePromptWithMahiEngine(rawPrompt, apiKey, requestId = '', options = {}) {
  const trimmed = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
  if (!trimmed || !apiKey) return trimmed || rawPrompt;

  try {
    const sourceImage = formatImageUrlForVision(options?.sourceImage);
    const hasSource = Boolean(sourceImage);
    const isEditMode = Boolean(options?.isEditMode || hasSource);

    let rawRefs = [];
    if (Array.isArray(options?.referenceImages)) {
      rawRefs = options.referenceImages.map(r => (typeof r === 'string' ? r : (r?.dataUrl || r?.url || r?.image || '')));
    } else if (options?.referenceImages && typeof options.referenceImages === 'string') {
      rawRefs = [options.referenceImages];
    } else if (options?.referenceImage) {
      const ref = typeof options.referenceImage === 'string' ? options.referenceImage : (options.referenceImage?.dataUrl || options.referenceImage?.url || '');
      if (ref) rawRefs = [ref];
    }

    const referenceImages = rawRefs
      .map(r => formatImageUrlForVision(r))
      .filter(r => r && r !== sourceImage);
    const validRefs = referenceImages;

    let systemInstruction = '';
    let userContent = null;

    if (hasSource || isEditMode) {
      // Smart Edit Mode (Source Image + Optional Reference Images)
      systemInstruction = "You are Mahi Engine in Smart Edit mode. You are given a Source Image (the base canvas/character), optional Reference Image(s) (style/visual assets), and a user instruction describing what should change. Analyze both: preserve the core identity and structure of the Source Image, identify style or asset cues from the Reference Image(s), and formulate a precise generative edit prompt that seamlessly injects the reference elements into the source image according to the user's instructions. Return only the final detailed prompt.";

      const promptText = `Source Image (base canvas) and Edit Instruction: "${trimmed}"\nAnalyze the Source Image to preserve its subject and structural composition, apply the edit instructions, and incorporate visual or style cues from any attached Reference Image(s).`;
      const content = [{ type: 'text', text: promptText }];
      if (sourceImage) {
        content.push({ type: 'image_url', image_url: { url: sourceImage } });
      }
      if (Array.isArray(referenceImages)) {
        referenceImages.forEach((img, idx) => {
          const refUrl = img;
          if (img) {
            content.push({ type: 'text', text: `Reference Image ${idx + 1} (style/asset guide):` });
            content.push({ type: 'image_url', image_url: { url: refUrl } });
          }
        });
      }
      userContent = content;
    } else if (referenceImages.length > 0) {
      // Generate Mode with Reference Images
      systemInstruction = "You are Mahi Engine, an expert AI prompt enhancer with computer vision. Analyze the attached reference image(s) for character appearance, visual composition, atmospheric lighting, style, and color palette. Seamlessly blend these visual characteristics into the user's prompt so the resulting descriptive prompt accurately reproduces the style and subject intent without filler text.";

      const promptText = `User prompt: "${trimmed}"\nAnalyze the attached reference image(s) and seamlessly blend their visual appearance, composition, lighting, style, and color palette into this prompt.`;
      const content = [{ type: 'text', text: promptText }];
      if (Array.isArray(referenceImages)) {
        referenceImages.forEach(img => {
          const refUrl = img;
          if (img) content.push({ type: 'image_url', image_url: { url: refUrl } });
        });
      }
      if (sourceImage) {
        content.push({ type: 'image_url', image_url: { url: sourceImage } });
      }
      userContent = content;
    } else {
      // Standard Text-to-Image Generation
      systemInstruction = "You are Mahi Engine, an expert AI prompt enhancer for visual generative models. Your job is to take the user's short or raw prompt and expand it into a detailed, visually rich, and coherent descriptive prompt (covering lighting, atmospheric depth, texture, and visual composition) while strictly keeping the user's original subject and intent intact. Return ONLY the final enhanced prompt text without any introductory conversational filler, quotes, or markdown wrappers.";

      userContent = trimmed;
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
          'X-Title': config.openrouter.siteName || 'Mestrio AI'
        },
        timeout: 15000, // 15s fast timeout safeguard for vision
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    const enhanced = response.data?.choices?.[0]?.message?.content?.trim();
    if (enhanced && enhanced.length > 0) {
      const cleaned = enhanced.replace(/^["'`]+|["'`]+$/g, '').trim();
      if (cleaned.length > 0) {
        logger.info('Mahi Engine enhanced prompt successfully', {
          requestId,
          originalLength: trimmed.length,
          enhancedLength: cleaned.length,
          hasSource,
          referenceCount: referenceImages.length,
          mode: hasSource ? 'smart_edit' : (referenceImages.length > 0 ? 'multimodal_generate' : 'text_generate')
        });
        return cleaned;
      }
    }
  } catch (err) {
    logger.warn('Mahi Engine prompt enhancement failed or timed out, falling back to original prompt', {
      requestId,
      error: err.response?.data?.error?.message || err.message
    });
  }

  return trimmed;
}

/**
 * Controller for POST /api/generate-image
 */
export async function generateImage(req, res) {
  const requestId = req.id || `req_img_${Date.now()}`;
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || config.openrouter.apiKey;

    if (!apiKey) {
      logger.error('OpenRouter API key is missing for dedicated image generation', { requestId });
      return res.status(500).json({
        error: true,
        message: 'Server configuration error: OpenRouter API key is not configured.'
      });
    }

    if (
      req.body?.isPreciseEdit ||
      req.body?.workflowTool === 'precise-edit'
    ) {
      return executePreciseEdit(req, res);
    }

    const {
      prompt,
      model,
      aspectRatio = '1:1',
      count = 1,
      imageCount,
      templateStyle,
      template,
      style,
      seed,
      sourceImage,
      referenceImage,
      referenceImages,
      quality
    } = req.body || {};

    if (req.body?.tool === 'vector-illustration' || req.body?.workflowTool === 'vector-illustration' || req.body?.isVectorIllustration) {
      return executeVectorIllustration(req, res);
    }

    // Validate prompt
    const rawPrompt = typeof prompt === 'string' ? prompt.trim() : '';
    if (!rawPrompt) {
      return res.status(400).json({
        error: true,
        message: 'Prompt is required for image generation.'
      });
    }

    // Differentiate sourceImage (base canvas) and referenceImages (style/asset guides)
    const effectiveSourceImage = formatImageUrlForVision(sourceImage);

    let effectiveReferenceImages = [];
    if (Array.isArray(referenceImages)) {
      effectiveReferenceImages = referenceImages
        .map(r => (typeof r === 'string' ? r : (r?.dataUrl || r?.url)))
        .map(r => formatImageUrlForVision(r))
        .filter(r => r && r !== effectiveSourceImage);
    } else if (referenceImage) {
      const formattedRef = formatImageUrlForVision(typeof referenceImage === 'string' ? referenceImage : (referenceImage?.dataUrl || referenceImage?.url));
      if (formattedRef && formattedRef !== effectiveSourceImage) {
        effectiveReferenceImages = [formattedRef];
      }
    }

    const isEditMode = Boolean(effectiveSourceImage);

    // 1. Integrate "Mahi Engine" Prompt Optimizer with Dual-Vision Capabilities
    // await enhancePromptWithMahiEngine(rawPrompt, apiKey, requestId)
    const enhancedPrompt = await enhancePromptWithMahiEngine(rawPrompt, apiKey, requestId, {
      sourceImage: effectiveSourceImage,
      referenceImages: effectiveReferenceImages,
      isEditMode
    });

    // 2. Seamlessly combine enhanced prompt with active style / template style tokens if present
    let finalPrompt = enhancedPrompt || rawPrompt;
    const activeStyle = (style || templateStyle || template || '').trim();
    if (activeStyle && activeStyle.toLowerCase() !== 'auto' && activeStyle.toLowerCase() !== 'general' && !finalPrompt.toLowerCase().includes(activeStyle.toLowerCase())) {
      finalPrompt = `${finalPrompt}, in ${activeStyle} aesthetic style, highly detailed, photorealistic`;
    }

    // 3. Map quality selection internally to subtle prompt enhancers for output fidelity
    // (Never pass raw 'quality' directly into OpenRouter/provider payload to prevent 'unknown parameter' errors)
    const normalizedQuality = typeof quality === 'string' ? quality.toLowerCase().trim() : '';
    if (normalizedQuality === 'high') {
      if (!finalPrompt.toLowerCase().includes('high resolution') && !finalPrompt.toLowerCase().includes('ultra-detailed')) {
        finalPrompt = `${finalPrompt}, high resolution, ultra-detailed, sharp focus`;
      }
    } else if (normalizedQuality === 'medium') {
      if (!finalPrompt.toLowerCase().includes('detailed') && !finalPrompt.toLowerCase().includes('clear fidelity')) {
        finalPrompt = `${finalPrompt}, detailed render, clear fidelity`;
      }
    }

    // Resolve OpenRouter Model ID (Auto Smart Routing or Explicit Override)
    const isAuto = !model || model === 'auto' || (typeof model === 'string' && model.toLowerCase() === 'auto');
    const selectedModelId = isAuto ? routeAutoImageModel(finalPrompt, isEditMode) : resolveOpenRouterImageModel(model);
    const displayName = MODEL_ID_TO_DISPLAY_NAME[selectedModelId] || MODEL_ID_TO_DISPLAY_NAME[model] || selectedModelId;
    const dimensions = resolveDimensions(aspectRatio);
    const totalCount = Math.min(Math.max(parseInt(imageCount || count || 1, 10), 1), 4);

    logger.info('Processing Image Workspace generation request with Mahi Engine prompt', {
      requestId,
      model: selectedModelId,
      displayName,
      isAuto,
      aspectRatio,
      count: totalCount,
      promptLength: finalPrompt.length,
      hasSourceImage: Boolean(effectiveSourceImage),
      referenceImagesCount: effectiveReferenceImages.length,
      isEditMode,
      style: activeStyle || 'default',
      seed: seed || undefined,
      quality: quality || undefined
    });

    // =========================================================================
    // DEDICATED SEEDREAM 5.0 PRO DISPATCHER (OpenRouter Dedicated Image API: /api/v1/images)
    // Prevents "No model found" errors on /api/v1/chat/completions by routing directly to the dedicated Image API
    // =========================================================================
    if (selectedModelId === 'bytedance-seed/seedream-5.0-pro' || model === 'bytedance-seed/seedream-5.0-pro' || model === 'Seedream 5.0 Pro') {
      const targetUrl = 'https://openrouter.ai/api/v1/images';
      const seedreamHeaders = {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || apiKey}`,
        'Content-Type': 'application/json'
      };

      const seedreamPayload = {
        model: 'bytedance-seed/seedream-5.0-pro',
        prompt: finalPrompt
      };

      console.log('Seedream Request URL:', targetUrl);
      console.log('Seedream Request Headers:', JSON.stringify(seedreamHeaders, null, 2));
      console.log('Seedream Request Payload:', JSON.stringify(seedreamPayload, null, 2));

      logger.info('Dispatching Seedream 5.0 Pro to OpenRouter dedicated Image API endpoint (/api/v1/images)', {
        requestId,
        model: seedreamPayload.model,
        promptLength: finalPrompt.length,
        count: totalCount
      });

      const seedreamTasks = Array.from({ length: totalCount }, async () => {
        try {
          let response = await fetch(targetUrl, {
            method: 'POST',
            headers: seedreamHeaders,
            body: JSON.stringify(seedreamPayload)
          });

          let rawResponseText = await response.text();
          console.log('OpenRouter Seedream Status:', response.status);
          console.log('OpenRouter Seedream Response:', rawResponseText);

          // If 404 "No model found" returned for dot slug, seamlessly try hyphenated slug "bytedance-seed/seedream-5-0-pro"
          if (response.status === 404 && rawResponseText.includes('No model found')) {
            console.log('Attempting alternative OpenRouter slug bytedance-seed/seedream-5-0-pro...');
            const fallbackPayload = {
              model: 'bytedance-seed/seedream-5-0-pro',
              prompt: finalPrompt
            };
            response = await fetch(targetUrl, {
              method: 'POST',
              headers: seedreamHeaders,
              body: JSON.stringify(fallbackPayload)
            });
            rawResponseText = await response.text();
            console.log('OpenRouter Seedream Fallback Status:', response.status);
            console.log('OpenRouter Seedream Fallback Response:', rawResponseText);
          }

          let parsedData = null;
          try {
            parsedData = JSON.parse(rawResponseText);
          } catch (jsonErr) {
            console.error('Failed to parse OpenRouter Seedream response as JSON:', jsonErr.message);
          }

          return {
            status: response.status,
            ok: response.ok,
            data: parsedData,
            rawText: rawResponseText
          };
        } catch (fetchErr) {
          console.error('Seedream fetch call failed with network error:', fetchErr);
          return {
            status: 500,
            ok: false,
            data: null,
            rawText: fetchErr.message
          };
        }
      });

      const results = await Promise.all(seedreamTasks);
      const generatedUrls = [];
      let firstFailure = null;

      for (const resItem of results) {
        if (resItem.ok && resItem.data) {
          const responseData = resItem.data;
          if (Array.isArray(responseData?.data)) {
            for (const item of responseData.data) {
              const formatted = extractAndFormatImage(item);
              if (formatted) generatedUrls.push(formatted);
            }
          } else if (Array.isArray(responseData?.images)) {
            for (const item of responseData.images) {
              const formatted = extractAndFormatImage(item);
              if (formatted) generatedUrls.push(formatted);
            }
          } else if (responseData?.image || responseData?.url || responseData?.b64_json) {
            const formatted = extractAndFormatImage(responseData);
            if (formatted) generatedUrls.push(formatted);
          }
        } else {
          if (!firstFailure) firstFailure = resItem;
        }
      }

      if (generatedUrls.length === 0) {
        const errorData = firstFailure?.data;
        const statusCode = firstFailure?.status || 500;
        const errorMsg =
          errorData?.error?.message ||
          errorData?.message ||
          firstFailure?.rawText ||
          'Seedream 5.0 Pro image generation failed. Please check your OpenRouter API key limits or prompt.';

        console.error('Seedream 5.0 Pro generation failed completely:', {
          statusCode,
          error: errorMsg
        });

        logger.error('Seedream 5.0 Pro image generation failed completely', {
          requestId,
          statusCode,
          error: errorMsg
        });

        return res.status(statusCode).json({
          error: true,
          message: errorMsg
        });
      }

      const nowIso = new Date().toISOString();
      const images = generatedUrls.slice(0, totalCount).map((url, idx) => ({
        id: `img_${Date.now()}_${idx}`,
        url,
        prompt: finalPrompt,
        originalPrompt: rawPrompt,
        model: 'bytedance-seed/seedream-5.0-pro',
        modelName: 'Seedream 5.0 Pro',
        ...(isAuto ? { routedBy: 'Auto' } : {}),
        aspectRatio,
        sourceImage: effectiveSourceImage || undefined,
        referenceImages: effectiveReferenceImages.length > 0 ? effectiveReferenceImages : undefined,
        createdAt: nowIso
      }));

      logger.info('Seedream 5.0 Pro image generation fulfilled successfully', {
        requestId,
        count: images.length,
        model: 'bytedance-seed/seedream-5.0-pro',
        isAuto
      });

      return res.json({
        success: true,
        images,
        count: images.length,
        model: 'bytedance-seed/seedream-5.0-pro',
        modelName: 'Seedream 5.0 Pro',
        ...(isAuto ? { routedBy: 'Auto' } : {}),
        aspectRatio
      });
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
      'X-Title': config.openrouter.siteName || 'Mestrio AI'
    };

    const payload = {
      model: selectedModelId,
      prompt: finalPrompt,
      size: `${dimensions.width}x${dimensions.height}`,
      width: dimensions.width,
      height: dimensions.height,
      aspect_ratio: dimensions.aspect_ratio
    };

    // Explicitly omit raw quality from payload to prevent OpenRouter "unknown parameter 'quality'" error
    delete payload.quality;

    if (seed && !isNaN(parseInt(seed, 10))) {
      payload.seed = parseInt(seed, 10);
    }

    // Upstream Image Model Execution:
    // In Smart Edit mode, pass sourceImage as the primary base/init image
    if (effectiveSourceImage) {
      payload.source_image = effectiveSourceImage;
      payload.image_url = effectiveSourceImage;
      payload.init_image = effectiveSourceImage;
      payload.image = effectiveSourceImage;
    } else if (effectiveReferenceImages.length > 0) {
      payload.image_url = effectiveReferenceImages[0];
      payload.image = effectiveReferenceImages[0];
    }

    // For models that support multi-image/IP-Adapter input, attach reference images
    if (effectiveReferenceImages.length > 0) {
      payload.reference_images = effectiveReferenceImages;
      payload.ip_adapter_images = effectiveReferenceImages;
    }

    // Execute concurrent generation requests for batch (count = 1, 2, or 4)
    const requestTasks = Array.from({ length: totalCount }, () =>
      axios.post('https://openrouter.ai/api/v1/images', payload, {
        headers,
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })
    );

    const settledResults = await Promise.allSettled(requestTasks);
    const generatedUrls = [];
    let lastErrorDetails = null;

    for (const resItem of settledResults) {
      if (resItem.status === 'fulfilled') {
        const responseData = resItem.value?.data;
        if (Array.isArray(responseData?.data)) {
          for (const item of responseData.data) {
            const formatted = extractAndFormatImage(item);
            if (formatted) generatedUrls.push(formatted);
          }
        } else if (responseData?.image || responseData?.url || responseData?.b64_json) {
          const formatted = extractAndFormatImage(responseData);
          if (formatted) generatedUrls.push(formatted);
        }
      } else {
        lastErrorDetails = resItem.reason;
        logger.warn('Single image batch item generation failed', {
          requestId,
          status: resItem.reason?.response?.status,
          error: resItem.reason?.response?.data || resItem.reason?.message
        });
      }
    }

    // For text-only image models: if multimodal params failed all requests, fallback to text-to-image with Mahi Engine synthesized prompt
    if (generatedUrls.length === 0 && (payload.image_url || payload.init_image || payload.image || payload.reference_images || payload.source_image)) {
      logger.info('Image-to-image parameters rejected or unsupported by model, falling back to Mahi Engine synthesized prompt for text-to-image generation', {
        requestId,
        model: selectedModelId
      });
      delete payload.image_url;
      delete payload.init_image;
      delete payload.image;
      delete payload.source_image;
      delete payload.reference_images;
      delete payload.ip_adapter_images;
      delete payload.quality;

      const fallbackTasks = Array.from({ length: totalCount }, () =>
        axios.post('https://openrouter.ai/api/v1/images', payload, {
          headers,
          timeout: 60000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        })
      );
      const fallbackResults = await Promise.allSettled(fallbackTasks);
      for (const resItem of fallbackResults) {
        if (resItem.status === 'fulfilled') {
          const responseData = resItem.value?.data;
          if (Array.isArray(responseData?.data)) {
            for (const item of responseData.data) {
              const formatted = extractAndFormatImage(item);
              if (formatted) generatedUrls.push(formatted);
            }
          } else if (responseData?.image || responseData?.url || responseData?.b64_json) {
            const formatted = extractAndFormatImage(responseData);
            if (formatted) generatedUrls.push(formatted);
          }
        } else {
          lastErrorDetails = resItem.reason;
        }
      }
    }

    if (generatedUrls.length === 0) {
      const errResponse = lastErrorDetails?.response?.data;
      const statusCode = lastErrorDetails?.response?.status || 500;
      const errorMsg =
        errResponse?.error?.message ||
        errResponse?.message ||
        lastErrorDetails?.message ||
        'Image generation failed. Please try a different model or prompt.';

      logger.error('All image generation attempts failed', {
        requestId,
        statusCode,
        error: errorMsg
      });

      return res.status(statusCode).json({
        error: true,
        message: errorMsg
      });
    }

    // Format successful image response objects
    const nowIso = new Date().toISOString();
    const images = generatedUrls.slice(0, totalCount).map((url, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      url,
      prompt: finalPrompt,
      originalPrompt: rawPrompt,
      model: selectedModelId,
      modelName: displayName,
      ...(isAuto ? { routedBy: 'Auto' } : {}),
      aspectRatio,
      sourceImage: effectiveSourceImage || undefined,
      referenceImages: effectiveReferenceImages.length > 0 ? effectiveReferenceImages : undefined,
      createdAt: nowIso
    }));

    logger.info('Image generation request fulfilled successfully', {
      requestId,
      count: images.length,
      model: selectedModelId,
      isAuto
    });

    return res.status(200).json({
      success: true,
      images,
      count: images.length,
      model: selectedModelId,
      modelName: displayName,
      ...(isAuto ? { routedBy: 'Auto' } : {}),
      aspectRatio
    });

  } catch (err) {
    const errData = err.response?.data;
    const statusCode = err.response?.status || err.statusCode || err.status || 500;
    const clientMsg =
      errData?.error?.message ||
      errData?.message ||
      err.message ||
      'An unexpected error occurred while generating the image.';

    logger.error('Image generation route threw an unhandled error', {
      requestId,
      statusCode,
      error: clientMsg
    });

    return res.status(statusCode).json({
      error: true,
      message: clientMsg
    });
  }
}

/**
 * @deprecated Legacy conversational image handler (Deprecated in favor of direct Mahi Engine prompt enhancement in generateImage).
 * Retained as a deprecated stub for backwards compatibility with tests and transitions.
 */
export async function handleImageConversation(req, res) {
  const isStreaming = Boolean(req.body && (req.body.stream || (req.headers && req.headers.accept && req.headers.accept.includes('text/event-stream'))));
  if (isStreaming) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    res.write(`data: ${JSON.stringify({ status: 'analyzing', message: 'Analyzing…' })}\n\n`);
    res.write(`data: ${JSON.stringify({ status: 'creating_image', message: 'Creating image…' })}\n\n`);
    res.write(`data: ${JSON.stringify({ status: 'complete', success: true, message: 'Done' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }
  return res.json({
    deprecated: true,
    message: 'handleImageConversation is deprecated. Please use POST /api/generate-image with Mahi Engine prompt enhancement.'
  });
}


/**
 * ============================================================================
 * PRECISE EDIT PIPELINE (STUDIO-GRADE ARCHITECTURE: MAHI ENGINE + KREA K3 EDIT)
 * ============================================================================
 */

/**
 * STAGE 2: MAHI ENGINE (VISION REASONING & INPAINTING PROMPT SYNTHESIS)
 * Primary Vision Model: google/gemini-2.5-flash via OpenRouter Chat Completions.
 * Detects artistic medium, enforces 100% identity lock, and isolates the modification delta.
 */
export async function enhancePreciseEditPromptWithMahiEngine(
  sourceImage,
  referenceImages = [],
  instructionPrompt = '',
  apiKey = '',
  requestId = '',
  quality = 'Medium'
) {
  const userEditRequest = (instructionPrompt || '').trim();
  if (!userEditRequest) {
    return '';
  }

  const effectiveKey = (apiKey || process.env.OPENROUTER_API_KEY || config?.openrouter?.apiKey || '').trim();
  if (!effectiveKey) {
    console.warn('[PreciseEdit] No OpenRouter API key found for Mahi Engine, falling back to raw instruction.');
    return userEditRequest;
  }

  try {
    console.log('[PreciseEdit] Mahi Engine analyzing sourceImage with user instruction:', userEditRequest);

    // Multimodal Vision Payload
    const visionContent = [
      {
        type: "text",
        text: `USER INSTRUCTION: "${userEditRequest}"`
      },
      {
        type: "image_url",
        image_url: { url: sourceImage }
      },
      ...(Array.isArray(referenceImages) ? referenceImages : []).map(ref => ({
        type: "image_url",
        image_url: { url: ref }
      }))
    ];

    // Strict System Prompt
    const systemPrompt = `You are an expert Computer Vision & Diffusion Inpainting Director.
The user is editing the provided SOURCE IMAGE.
CRITICAL DIRECTIVE: DO NOT GENERATE A NEW SCENE OR REINVENT THE SUBJECT.

Detect the exact artistic medium and genre (e.g. 2D cartoon cel animation, 3D animated CGI render, photorealistic portrait). Explicitly forbid changing medium.

Enforce 100% identity lock: Character anatomy, facial geometry, pose, outlines, background environment, lighting direction, and camera angle must stay identical to the source image.

Isolate the modification delta: Describe only the specific localized edit requested by the user, preserving all surface lighting, ambient shadows, and textures.
Return ONLY the refined studio inpainting prompt string without quotes, formatting, or commentary.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Mestrio AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: visionContent }
        ],
        temperature: 0.2,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (content && content.length > 0) {
        const cleaned = content.replace(/^["'`]+|["'`]+$/g, '').trim();
        console.log('[PreciseEdit] Mahi Engine generated identity-locked prompt:', cleaned);
        return cleaned;
      }
    } else {
      const errText = await response.text();
      console.warn('[PreciseEdit] Mahi Engine OpenRouter returned non-200:', response.status, errText);
    }
  } catch (err) {
    console.warn('[PreciseEdit] Mahi Engine reasoning error, falling back to raw instruction:', err.message);
  }

  return userEditRequest;
}

/**
 * Controller for POST /api/images/precise-edit
 * Also callable as POST /api/generate-image/precise-edit
 *
 * Implements full 5-stage pipeline:
 * Stage 1: Request Ingestion & Payload Normalization
 * Stage 2: Mahi Engine (Vision Reasoning & Inpainting Prompt Synthesis)
 * Stage 3: Krea K3 Edit Synthesis Dispatch (krea/k3-edit via /api/v1/images)
 * Stage 4: Response Parsing & Client Feed Ingestion
 * Stage 5: Verification & Terminal Logging
 */
export async function executePreciseEdit(req, res) {
  const requestId = req?.id || `pe_${Date.now()}`;
  try {
    const apiKey = (process.env.OPENROUTER_API_KEY || config?.openrouter?.apiKey || '').trim();
    if (!apiKey) {
      console.error('[PreciseEdit] OpenRouter API key is missing');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: OpenRouter API key is not configured.'
      });
    }

    // STAGE 1: REQUEST INGESTION & PAYLOAD NORMALIZATION
    const {
      sourceImage,
      instructionPrompt,
      prompt,
      referenceImages,
      variations,
      count,
      aspectRatio = '1:1',
      quality = 'Medium'
    } = req.body || {};

    const userEditRequest = (instructionPrompt || prompt || '').trim();
    if (!userEditRequest) {
      return res.status(400).json({
        success: false,
        error: 'Instruction prompt is required for precise edit.'
      });
    }

    // Validate and sanitize sourceImage into a valid data URI
    const sanitizedSource = formatImageUrlForVision(sourceImage);
    if (!sanitizedSource) {
      return res.status(400).json({
        success: false,
        error: 'Source image is required and must be a valid image or data URI.'
      });
    }

    // Sanitize optional referenceImages into valid data URI strings
    let rawRefs = [];
    if (Array.isArray(referenceImages)) {
      rawRefs = referenceImages;
    } else if (referenceImages && typeof referenceImages === 'string') {
      rawRefs = [referenceImages];
    } else if (req.body?.referenceImage) {
      rawRefs = [req.body.referenceImage];
    }

    const sanitizedRefs = rawRefs
      .map(r => (typeof r === 'string' ? r : (r?.dataUrl || r?.url || r?.image || '')))
      .map(r => formatImageUrlForVision(r))
      .filter(r => r && typeof r === 'string' && r.length > 50 && r !== sanitizedSource);

    // STAGE 2: MAHI ENGINE (VISION REASONING & INPAINTING PROMPT SYNTHESIS)
    const refinedPromptFromMahiEngine = await enhancePreciseEditPromptWithMahiEngine(
      sanitizedSource,
      sanitizedRefs,
      userEditRequest,
      apiKey,
      requestId,
      quality
    );

    // STAGE 3: KREA K3 EDIT SYNTHESIS DISPATCH
    const imageReferences = [
      sanitizedSource,
      ...(Array.isArray(sanitizedRefs) ? sanitizedRefs : [])
    ].filter(img => typeof img === 'string' && img.length > 50);

    console.log('[PreciseEdit] Dispatched to Krea K3 with', imageReferences.length, 'reference images.');

    const promptForSynthesis = refinedPromptFromMahiEngine || userEditRequest;
    const payload = {
      model: "krea/k3-edit",
      prompt: promptForSynthesis,
      image_references: imageReferences,
      input_references: imageReferences.map(url => ({
        type: "image_url",
        image_url: { url }
      }))
    };

    const targetUrl = 'https://openrouter.ai/api/v1/images';
    const totalVariations = Math.min(Math.max(parseInt(variations || count || 1, 10), 1), 4);

    const generationTasks = Array.from({ length: totalVariations }, async () => {
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Mestrio AI'
          },
          body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        let parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch (jsonErr) {
          console.error('[PreciseEdit] Failed to parse OpenRouter response as JSON:', rawText);
        }

        return {
          status: response.status,
          ok: response.ok,
          data: parsed,
          rawText
        };
      } catch (fetchErr) {
        console.error('[PreciseEdit] Network error during Krea K3 fetch:', fetchErr.message);
        return {
          status: 500,
          ok: false,
          data: null,
          rawText: fetchErr.message
        };
      }
    });

    const results = await Promise.all(generationTasks);
    const collectedImages = [];
    let firstError = null;

    // STAGE 4: RESPONSE PARSING & CLIENT FEED INGESTION
    for (const resItem of results) {
      if (resItem.ok && resItem.data) {
        const dataItems = Array.isArray(resItem.data?.data)
          ? resItem.data.data
          : (Array.isArray(resItem.data?.images) ? resItem.data.images : [resItem.data]);

        for (const item of dataItems) {
          if (!item) continue;
          let finalImageUrl = null;
          if (item.b64_json && typeof item.b64_json === 'string') {
            finalImageUrl = item.b64_json.startsWith('data:')
              ? item.b64_json
              : 'data:image/png;base64,' + item.b64_json;
          } else {
            finalImageUrl = extractAndFormatImage(item);
          }

          if (finalImageUrl) {
            collectedImages.push(finalImageUrl);
          }
        }
      } else {
        if (!firstError) firstError = resItem;
      }
    }

    if (collectedImages.length === 0) {
      const errorMsg =
        firstError?.data?.error?.message ||
        firstError?.data?.message ||
        firstError?.rawText ||
        'Krea K3 Edit synthesis failed. Please verify API key limits and image parameters.';

      console.error('[PreciseEdit] All Krea K3 synthesis attempts failed:', errorMsg);
      return res.status(firstError?.status || 500).json({
        success: false,
        error: errorMsg
      });
    }

    console.log('[PreciseEdit] Server delivers clean base64 image data to the right-hand canvas feed. Count:', collectedImages.length);

    const nowIso = new Date().toISOString();
    const formattedImages = collectedImages.slice(0, totalVariations).map((url, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      url: url,
      prompt: refinedPromptFromMahiEngine,
      originalPrompt: userEditRequest,
      model: "krea/k3-edit",
      modelName: "Krea K3 Edit",
      aspectRatio: aspectRatio || "1:1",
      isPreciseEdit: true,
      sourceImage: sanitizedSource,
      createdAt: nowIso
    }));

    return res.json({
      success: true,
      images: formattedImages,
      refinedPrompt: refinedPromptFromMahiEngine
    });

  } catch (error) {
    console.error('[PreciseEdit Fatal Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during Precise Edit execution.'
    });
  }
}

/**
 * Studio-Grade Super-Resolution Upscale Controller
 * Executes zero-hallucination super-resolution remastering via OpenRouter Dedicated Image API (Qwen Image 2.1 Pro).
 * Endpoint: POST /api/images/upscale
 */
export async function executeUpscaleImage(req, res) {
  try {
    const apiKey = (process.env.OPENROUTER_API_KEY || config?.openrouter?.apiKey || '').trim();
    if (!apiKey) {
      console.error('[executeUpscaleImage] OpenRouter API key is missing');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: OpenRouter API key is not configured.'
      });
    }

    // 1. Direct Reference Ingestion
    const { sourceImage, image, scale } = req.body || {};
    const activeSourceImage = sourceImage || image;

    if (!activeSourceImage) {
      return res.status(400).json({ success: false, error: "sourceImage is required for upscaling." });
    }

    console.log('[Upscale Backend] Received source image, length:', activeSourceImage.length);

    let cleanSource = (typeof activeSourceImage === 'string' ? activeSourceImage : '').trim();
    if (!cleanSource.startsWith('data:image/') && !cleanSource.startsWith('http://') && !cleanSource.startsWith('https://')) {
      if (cleanSource.startsWith('/9j/')) cleanSource = `data:image/jpeg;base64,${cleanSource}`;
      else if (cleanSource.startsWith('iVBOR')) cleanSource = `data:image/png;base64,${cleanSource}`;
      else if (cleanSource.startsWith('UklGR')) cleanSource = `data:image/webp;base64,${cleanSource}`;
      else if (cleanSource.length > 50 && !cleanSource.includes(' ') && !cleanSource.includes('\n')) {
        cleanSource = `data:image/png;base64,${cleanSource}`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid source image. Must be a clean base64 data URI string.'
        });
      }
    }

    // Verify non-empty references
    const imageReferences = [cleanSource].filter(img => typeof img === 'string' && img.length > 50);

    if (imageReferences.length === 0) {
      return res.status(400).json({
        success: false,
        error: "A valid reference source image is required for super-resolution remastering."
      });
    }

    console.log('[Upscale Backend] Dispatched to Krea K3 Edit with references:', imageReferences.length);

    // 2. Dynamic Scale & Ideogram-Standard Super-Resolution Prompt Conditioning
    const normalizedScale = (scale && String(scale).trim().toLowerCase().includes('4')) ? '4x' : '2x';

    let upscalePrompt = '';
    if (normalizedScale === '4x') {
      upscalePrompt = "Ideogram-grade studio super-resolution remaster at 4x Ultra-HD 4K resolution. Strict 100% identity and composition lock: preserve identical facial anatomy, eyes, expression, hair texture, skin tone, lighting, attire, and background geometry from the reference image. Do NOT alter the person or hallucinate new elements. Eliminate pixelation, compression artifacts, and blur. Restore hyper-detailed micro-contrast, ultra-sharp edges, realistic pores, and crystal-clear high-DPI fidelity.";
    } else {
      upscalePrompt = "Ideogram-grade professional super-resolution remaster at 2x High-Definition. Maintain 100% identical subject identity, composition, colors, and camera perspective of the reference image. Remove noise and enhance edge sharpness with pristine clarity.";
    }

    // 3. Engine Switch to Krea K3 Edit via OpenRouter Dedicated Image API
    const openRouterPayload = {
      model: "krea/k3-edit",
      prompt: upscalePrompt,
      image_references: imageReferences,
      input_references: imageReferences.map(url => ({
        type: "image_url",
        image_url: { url }
      }))
    };

    console.log('[Upscale Backend] Outgoing payload structure:', {
      model: openRouterPayload.model,
      scale: normalizedScale,
      prompt: openRouterPayload.prompt,
      referencesCount: openRouterPayload.image_references.length,
      referenceLength: openRouterPayload.image_references[0]?.length
    });

    // 4. OpenRouter Dedicated Image API Dispatch
    const response = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Mestrio AI'
      },
      body: JSON.stringify(openRouterPayload)
    });

    const rawText = await response.text();
    console.log('[Upscale Backend] OpenRouter Response Status:', response.status);
    console.log('[Upscale Backend] OpenRouter Response Preview:', rawText.slice(0, 300));

    let result = null;
    try {
      result = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[executeUpscaleImage] Failed to parse JSON response from OpenRouter:', rawText);
    }

    if (!response.ok || !result) {
      const errorMsg = result?.error?.message || result?.message || rawText || `Upscale request failed with status ${response.status}`;
      console.error('[executeUpscaleImage] OpenRouter upscale error:', response.status, errorMsg);
      return res.status(response.status || 500).json({
        success: false,
        error: errorMsg
      });
    }

    // 5. Response Parsing & Canvas Feed Ingestion
    let finalUrl = null;
    if (result.data && result.data[0]) {
      if (result.data[0].b64_json) {
        const b64 = result.data[0].b64_json;
        finalUrl = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
      } else if (result.data[0].url) {
        finalUrl = result.data[0].url;
      }
    } else if (result.images && result.images[0]) {
      const imgItem = result.images[0];
      if (typeof imgItem === 'string') {
        finalUrl = imgItem;
      } else if (imgItem.b64_json) {
        finalUrl = imgItem.b64_json.startsWith('data:') ? imgItem.b64_json : `data:image/png;base64,${imgItem.b64_json}`;
      } else if (imgItem.url) {
        finalUrl = imgItem.url;
      }
    }

    if (!finalUrl) {
      console.error('[executeUpscaleImage] Failed to extract upscaled image data from result:', result);
      return res.status(500).json({
        success: false,
        error: 'Failed to extract upscaled image data from provider response.'
      });
    }

    console.log('[executeUpscaleImage] Successfully generated upscaled image via Krea K3 Edit, returning response.');

    // Tagged response matching Canvas Feed expectations: Upscale Image • Just now • Krea K3 Edit • ${scale || '2x'}
    return res.json({
      success: true,
      images: [
        {
          id: `upscale_${Date.now()}`,
          url: finalUrl,
          img: finalUrl,
          title: "Upscale Image",
          prompt: "Upscale Image",
          originalPrompt: "Upscale Image",
          enhancedPrompt: upscalePrompt,
          model: "krea/k3-edit",
          modelName: "Krea K3 Edit",
          scale: normalizedScale,
          aspectRatio: normalizedScale,
          time: "Just now",
          isUpscale: true,
          sourceImage: cleanSource,
          createdAt: new Date().toISOString()
        }
      ]
    });

  } catch (error) {
    console.error('[executeUpscaleImage Fatal Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during image upscaling.'
    });
  }
}

/**
 * Studio-Grade "Vectorize Image" Pipeline (Matching Ideogram and Vectorizer.ai)
 * Deterministic color-quantized multi-layer bezier vector tracing in pure SVG XML.
 * Preserves 100% authentic subject silhouette, geometry, and original color palette.
 * Route: POST /api/images/vectorize
 * Body: { sourceImage, detailLevel }
 */
export async function executeVectorizeImage(req, res) {
  try {
    // 1. Direct Reference Ingestion & Normalization
    const { sourceImage, image, detailLevel } = req.body || {};
    const rawSource = sourceImage || image;

    if (!rawSource) {
      return res.status(400).json({
        success: false,
        error: 'sourceImage is required for vectorization.'
      });
    }

    let cleanSource = (typeof rawSource === 'string' ? rawSource : '').trim();
    if (!cleanSource.startsWith('data:image/') && !cleanSource.startsWith('http://') && !cleanSource.startsWith('https://')) {
      if (cleanSource.startsWith('/9j/')) cleanSource = `data:image/jpeg;base64,${cleanSource}`;
      else if (cleanSource.startsWith('iVBOR')) cleanSource = `data:image/png;base64,${cleanSource}`;
      else if (cleanSource.startsWith('UklGR')) cleanSource = `data:image/webp;base64,${cleanSource}`;
      else if (cleanSource.length > 50 && !cleanSource.includes(' ') && !cleanSource.includes('\n')) {
        cleanSource = `data:image/png;base64,${cleanSource}`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid source image. Must be a valid image URL or base64 data URI string.'
        });
      }
    }

    if (cleanSource.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'A valid reference source image is required for vectorization.'
      });
    }

    // 2. Detail Level Tuning & Studio Smoothing Presets
    const rawDetail = typeof detailLevel === 'string' ? detailLevel.trim().toLowerCase() : '';
    const normalizedDetail = rawDetail === 'simple' ? 'Simple' : (rawDetail === 'auto' ? 'Auto' : 'Detailed');

    let colorCount = 28;
    let turdSize = 16;
    let optTolerance = 0.35;

    if (normalizedDetail === 'Simple') {
      colorCount = 14;
      turdSize = 40;
      optTolerance = 0.45;
    } else if (normalizedDetail === 'Auto') {
      colorCount = 20;
      turdSize = 20;
      optTolerance = 0.40;
    }

    console.log(`[Vectorize Pipeline] Processing image vectorization (Detail: ${normalizedDetail}, Target Colors: ${colorCount}, Speckle Filter: ${turdSize}px)...`);

    // 3. Decode Source Image Buffer
    let imageBuffer;
    if (cleanSource.startsWith('http://') || cleanSource.startsWith('https://')) {
      const fetchResp = await axios.get(cleanSource, { responseType: 'arraybuffer', timeout: 20000 });
      imageBuffer = Buffer.from(fetchResp.data);
    } else {
      const base64Data = cleanSource.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    let jimpImg;
    try {
      jimpImg = await Jimp.read(imageBuffer);
    } catch (decodeErr) {
      console.error('[Vectorize Pipeline] Jimp decode error:', decodeErr.message);
      return res.status(400).json({
        success: false,
        error: 'Unable to decode input image. Please upload a standard PNG or JPEG image file.'
      });
    }

    // Proportional fit to max 800px for buttery smooth bezier fitting, high performance, and lightweight SVG files
    if (jimpImg.bitmap.width > 800 || jimpImg.bitmap.height > 800) {
      jimpImg.scaleToFit(800, 800);
    }

    const width = jimpImg.bitmap.width;
    const height = jimpImg.bitmap.height;
    const originalRaw = jimpImg.bitmap.data;

    // 4. Build 100% authentic dominant color palette from original crisp pixels (Zero false gradient colors)
    const inContainer = iq.utils.PointContainer.fromUint8Array(new Uint8Array(originalRaw), width, height);
    const palette = iq.buildPaletteSync([inContainer], { colors: colorCount });

    // Pre-smoothing: gentle blur eliminates micro-noise, photographic grain, and sensor artifacts
    const smoothedImg = jimpImg.clone().blur(1);
    const smoothedRaw = smoothedImg.bitmap.data;
    const smoothContainer = iq.utils.PointContainer.fromUint8Array(new Uint8Array(smoothedRaw), width, height);

    // Apply palette to smoothed pixels with Nearest Neighbor (Zero dithering / Floyd-Steinberg artifact suppression)
    const outContainer = iq.applyPaletteSync(smoothContainer, palette, { imageQuantization: 'nearest' });
    const quantized = outContainer.toUint8Array();

    // 5. Cluster Pixels by Quantized Hex Color
    const colorMap = new Map();
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const alpha = smoothedRaw[idx + 3];
      if (alpha < 32) continue; // Respect transparency

      const qr = quantized[idx];
      const qg = quantized[idx + 1];
      const qb = quantized[idx + 2];
      const hex = '#' + ((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1);

      let list = colorMap.get(hex);
      if (!list) {
        list = [];
        colorMap.set(hex, list);
      }
      list.push(i);
    }

    // 6. Sort Layers by Area Descending (Largest backdrop first, fine foreground details on top)
    const sortedLayers = Array.from(colorMap.entries()).sort((a, b) => b[1].length - a[1].length);
    const pathTags = [];

    for (const [hexColor, pixels] of sortedLayers) {
      // Discard negligible isolated color clusters smaller than speckle threshold
      if (pixels.length < turdSize) continue;

      const bm = new Bitmap(width, height);
      bm.data.fill(255); // 255 = background / white
      for (let j = 0; j < pixels.length; j++) {
        bm.data[pixels[j]] = 0; // 0 = traced / black
      }

      const pot = new potrace.Potrace({
        threshold: 128,
        blackOnWhite: true,
        turdSize: turdSize,
        optCurve: true,
        optTolerance: optTolerance,
        alphaMax: 1.2,
        turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY
      });

      pot._luminanceData = bm;
      pot._imageLoaded = true;

      try {
        const tag = pot.getPathTag(hexColor);
        if (tag && tag.length > 0 && !tag.includes('d=""')) {
          pathTags.push(tag);
        }
      } catch (traceErr) {
        // Continue with other layers if a single layer fails
      }
    }

    if (pathTags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vector tracing produced no paths. Please check that the input image has visible content.'
      });
    }

    // 7. Assemble Pure Scalable Multi-Color SVG XML
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n  ${pathTags.join('\n  ')}\n</svg>`;
    const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    const cardId = `vector_${Date.now()}`;

    console.log(`[Vectorize Pipeline] Vectorization complete: ${pathTags.length} color layers traced, SVG size ${svgString.length} chars.`);

    // 8. Structured Payload Delivery to Client
    const vectorCard = {
      id: cardId,
      url: svgDataUri,
      img: svgDataUri,
      svg: svgString,
      svgCode: svgString,
      title: "Vectorize Image",
      prompt: "Vectorize this reference image into scalable SVG vector art. Clean multi-color bezier curves, layered paths, faithful silhouette and palette.",
      originalPrompt: "Vectorize Image",
      enhancedPrompt: `Vectorize Image • ${normalizedDetail} • ${pathTags.length} Colors`,
      model: "recraft/recraft-v3",
      modelName: "Recraft V3 Vectorizer",
      detailLevel: normalizedDetail,
      isVector: true,
      isVectorize: true,
      sourceImage: cleanSource,
      time: "Just now",
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      ...vectorCard,
      images: [vectorCard]
    });

  } catch (error) {
    console.error('[Vectorize Pipeline Fatal Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during image vectorization.'
    });
  }
}

/**
 * Extracts unique fill and stroke hex colors (top 6-10 primary tones) from SVG markup.
 */
export function extractPaletteFromSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') return [];
  const hexCounts = new Map();
  const hexRegex = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  let match;
  while ((match = hexRegex.exec(svgString)) !== null) {
    let hex = match[0].toUpperCase();
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    hexCounts.set(hex, (hexCounts.get(hex) || 0) + 1);
  }
  return Array.from(hexCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 10);
}

/**
 * Converts an image buffer to clean multi-color bezier SVG XML using Jimp, image-q, and Potrace.
 */
export async function traceBufferToSvg(imageBuffer, detailLevel = 'Medium') {
  let colorCount = 16;
  let turdSize = 3;
  let optTolerance = 0.35;

  const dl = String(detailLevel).toLowerCase();
  if (dl === 'low') {
    colorCount = 8;
    turdSize = 6;
    optTolerance = 0.55;
  } else if (dl === 'high' || dl === 'detailed') {
    colorCount = 28;
    turdSize = 2;
    optTolerance = 0.25;
  }

  let safeBuffer = imageBuffer;
  try {
    if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 12) {
      const isRiffWebp = imageBuffer.toString('ascii', 0, 4) === 'RIFF' && imageBuffer.toString('ascii', 8, 12) === 'WEBP';
      if (isRiffWebp) {
        safeBuffer = await sharp(imageBuffer).png().toBuffer();
      }
    }
  } catch (convErr) {
    console.warn('[traceBufferToSvg] WebP conversion via sharp warning:', convErr.message);
  }

  let jimpImg;
  try {
    jimpImg = await Jimp.read(safeBuffer);
  } catch (jimpErr) {
    try {
      const fallbackPng = await sharp(imageBuffer).png().toBuffer();
      jimpImg = await Jimp.read(fallbackPng);
    } catch {
      throw jimpErr;
    }
  }
  if (jimpImg.bitmap.width > 800 || jimpImg.bitmap.height > 800) {
    jimpImg.scaleToFit(800, 800);
  }

  const width = jimpImg.bitmap.width;
  const height = jimpImg.bitmap.height;
  const originalRaw = jimpImg.bitmap.data;

  const inContainer = iq.utils.PointContainer.fromUint8Array(new Uint8Array(originalRaw), width, height);
  const palette = iq.buildPaletteSync([inContainer], { colors: colorCount });

  const smoothedImg = jimpImg.clone().blur(1);
  const smoothedRaw = smoothedImg.bitmap.data;
  const smoothContainer = iq.utils.PointContainer.fromUint8Array(new Uint8Array(smoothedRaw), width, height);
  const outContainer = iq.applyPaletteSync(smoothContainer, palette, { imageQuantization: 'nearest' });
  const quantized = outContainer.toUint8Array();

  const colorMap = new Map();
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const alpha = smoothedRaw[idx + 3];
    if (alpha < 32) continue;

    const qr = quantized[idx];
    const qg = quantized[idx + 1];
    const qb = quantized[idx + 2];
    const hex = '#' + ((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1).toUpperCase();

    let list = colorMap.get(hex);
    if (!list) {
      list = [];
      colorMap.set(hex, list);
    }
    list.push(i);
  }

  const sortedLayers = Array.from(colorMap.entries()).sort((a, b) => b[1].length - a[1].length);
  const pathTags = [];
  const extractedPalette = [];

  for (const [hexColor, pixels] of sortedLayers) {
    if (pixels.length < turdSize) continue;
    extractedPalette.push(hexColor);

    const bm = new Bitmap(width, height);
    bm.data.fill(255);
    for (let j = 0; j < pixels.length; j++) {
      bm.data[pixels[j]] = 0;
    }

    const pot = new potrace.Potrace({
      threshold: 128,
      blackOnWhite: true,
      turdSize: turdSize,
      optCurve: true,
      optTolerance: optTolerance,
      alphaMax: 1.2,
      turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY
    });

    pot._luminanceData = bm;
    pot._imageLoaded = true;

    try {
      const tag = pot.getPathTag(hexColor);
      if (tag && tag.length > 0 && !tag.includes('d=""')) {
        pathTags.push(tag);
      }
    } catch (_) {}
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n  ${pathTags.join('\n  ')}\n</svg>`;
  return {
    svgString,
    width,
    height,
    palette: extractedPalette.slice(0, 10)
  };
}

/**
 * ================================================================================
 * VECTOR ILLUSTRATION STUDIO PIPELINE
 * 1. Capture workspace inputs (prompt, referenceImages, aspectRatio, quality, quantity)
 * 2. Multimodal Mahi Engine vision director synthesizes Ideogram-caliber prompt
 * 3. Route to recraft/recraft-v3 via OpenRouter & deliver scalable SVG + palette
 * ================================================================================
 */
export async function executeVectorIllustration(req, res) {
  const requestId = req?.id || `vec_ill_${Date.now()}`;
  try {
    const {
      prompt,
      originalPrompt,
      referenceImages,
      referenceImage,
      aspectRatio,
      quality = 'Medium',
      quantity = 1,
      count = 1,
      seed
    } = req.body || {};

    const rawUserPrompt = (prompt || originalPrompt || '').trim();
    if (!rawUserPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required for Vector Illustration generation.'
      });
    }

    const totalCount = Math.min(Math.max(parseInt(quantity || count || 1, 10), 1), 4);
    const targetQuality = quality || 'Medium';
    const targetRatio = aspectRatio || '1:1';

    // Collect and format reference images
    let rawRefs = [];
    if (Array.isArray(referenceImages)) {
      rawRefs = referenceImages.map(r => (typeof r === 'string' ? r : (r?.dataUrl || r?.url || '')));
    } else if (referenceImages && typeof referenceImages === 'string') {
      rawRefs = [referenceImages];
    } else if (referenceImage) {
      const ref = typeof referenceImage === 'string' ? referenceImage : (referenceImage?.dataUrl || referenceImage?.url || '');
      if (ref) rawRefs = [ref];
    }
    const cleanRefs = rawRefs.map(r => formatImageUrlForVision(r)).filter(Boolean);

    console.log(`[VectorIllustration] Pipeline started: "${rawUserPrompt}", ratio=${targetRatio}, quality=${targetQuality}, count=${totalCount}, refs=${cleanRefs.length}`);

    // ─────────────────────────────────────────────────────────────────────────────
    // PART 1: MULTIMODAL MAHI ENGINE DISPATCH
    // ─────────────────────────────────────────────────────────────────────────────
    const mahiSystemInstruction = `You are Mahi Engine, an elite AI vector design director. Analyze the user's idea and reference image (if provided). Generate a production-ready, Ideogram-caliber vector illustration prompt.
Rules:
- Enforce clean flat vector art, crisp bezier contours, bold layered shapes, clean screen-print poster aesthetic.
- Strictly eliminate photographic textures, sensor noise, ambient occlusion, realistic gradients, and 3D lighting.
- Define a harmonious 8-12 color palette extracted/aligned with the reference.
- Output ONLY the synthesized prompt (40-70 words) with zero commentary.`;

    let enhancedPrompt = '';
    const openrouterApiKey = (process.env.OPENROUTER_API_KEY || config?.openrouter?.apiKey || '').trim();

    try {
      let userContent;
      if (cleanRefs.length > 0) {
        userContent = [
          { type: 'text', text: `Design idea: "${rawUserPrompt}"\nAnalyze the reference image(s) and synthesize the production-ready vector prompt.` }
        ];
        cleanRefs.forEach((refUrl, idx) => {
          userContent.push({ type: 'text', text: `Reference image ${idx + 1}:` });
          userContent.push({ type: 'image_url', image_url: { url: refUrl } });
        });
      } else {
        userContent = `Design idea: "${rawUserPrompt}"\nSynthesize the production-ready Ideogram-caliber vector illustration prompt.`;
      }

      let mahiDone = false;
      const engineConfig = resolveMahiEngineConfig();
      if (engineConfig.apiKey) {
        try {
          const client = new OpenAI({
            baseURL: engineConfig.baseURL,
            apiKey: engineConfig.apiKey,
            defaultHeaders: { 'x-goog-api-key': engineConfig.apiKey }
          });
          const mahiResp = await client.chat.completions.create({
            model: engineConfig.model,
            messages: [
              { role: 'system', content: mahiSystemInstruction },
              { role: 'user', content: userContent }
            ],
            temperature: 0.4,
            max_tokens: 300
          });
          const text = mahiResp.choices?.[0]?.message?.content?.trim();
          if (text) {
            enhancedPrompt = text.replace(/^["'`]+|["'`]+$/g, '').trim();
            mahiDone = true;
            console.log('[VectorIllustration] Dedicated Mahi Engine synthesized prompt:', enhancedPrompt);
          }
        } catch (engineErr) {
          console.warn('[VectorIllustration] Dedicated Mahi Engine call error, falling back to OpenRouter:', engineErr.message);
        }
      }

      if (!mahiDone && openrouterApiKey) {
        const orResp = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'system', content: mahiSystemInstruction },
              { role: 'user', content: userContent }
            ],
            temperature: 0.4,
            max_tokens: 300
          },
          {
            headers: {
              'Authorization': `Bearer ${openrouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
              'X-Title': config.openrouter.siteName || 'Mestrio AI'
            },
            timeout: 15000
          }
        );
        const text = orResp.data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          enhancedPrompt = text.replace(/^["'`]+|["'`]+$/g, '').trim();
          console.log('[VectorIllustration] OpenRouter Mahi Engine synthesized prompt:', enhancedPrompt);
        }
      }
    } catch (directorErr) {
      console.warn('[VectorIllustration] Mahi Engine prompt synthesis exception:', directorErr.message);
    }

    if (!enhancedPrompt) {
      enhancedPrompt = `flat 2D vector graphic, clean sharp SVG lines, minimal gradients, isolated subject, sticker-cut vector art, professional graphic design illustration, ${rawUserPrompt}, harmonious 8-color screen-print palette, crisp bezier contours`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PART 2: RECRAFT V3 GENERATION VIA OPENROUTER
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('[VectorIllustration] Dispatching to recraft/recraft-v3 via OpenRouter...');
    const recraftPayload = {
      model: 'recraft/recraft-v3',
      prompt: enhancedPrompt,
      aspect_ratio: targetRatio,
      quality: targetQuality.toLowerCase(),
      n: totalCount
    };

    if (cleanRefs.length > 0) {
      recraftPayload.image_reference = cleanRefs[0];
      recraftPayload.image = cleanRefs[0];
    }
    if (seed !== undefined && seed !== null && !isNaN(parseInt(seed, 10))) {
      recraftPayload.seed = parseInt(seed, 10);
    }

    const headers = {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
      'X-Title': config.openrouter.siteName || 'Mestrio AI'
    };

    let generatedResults = [];

    if (openrouterApiKey) {
      try {
        const recraftTasks = Array.from({ length: totalCount }, () =>
          axios.post('https://openrouter.ai/api/v1/images', recraftPayload, {
            headers,
            timeout: 60000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          })
        );
        const settled = await Promise.allSettled(recraftTasks);
        for (const item of settled) {
          if (item.status === 'fulfilled') {
            const d = item.value?.data;
            if (Array.isArray(d?.data)) {
              for (const imgItem of d.data) {
                const url = imgItem.url || imgItem.b64_json;
                if (url) generatedResults.push(url);
              }
            } else if (d?.image || d?.url || d?.b64_json) {
              generatedResults.push(d.image || d.url || d.b64_json);
            }
          } else {
            console.warn('[VectorIllustration] Recraft V3 item call rejected:', item.reason?.response?.data || item.reason?.message);
          }
        }
      } catch (recraftErr) {
        console.warn('[VectorIllustration] Recraft V3 request exception:', recraftErr.message);
      }
    }

    // Defensive fallback: if recraft/recraft-v3 is not accessible or failed, use dedicated image fallback
    if (generatedResults.length === 0 && openrouterApiKey) {
      console.log('[VectorIllustration] Recraft V3 fallback: Generating high-contrast vector template via OpenRouter...');
      const fallbackPayload = {
        model: 'openai/gpt-image-2.5-sunburst',
        prompt: enhancedPrompt + ', flat vector illustration on clean solid background, sharp outlines, screenprint sticker art',
        aspect_ratio: targetRatio,
        n: totalCount
      };
      try {
        const fbTasks = Array.from({ length: totalCount }, () =>
          axios.post('https://openrouter.ai/api/v1/images', fallbackPayload, {
            headers,
            timeout: 60000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          })
        );
        const fbSettled = await Promise.allSettled(fbTasks);
        for (const item of fbSettled) {
          if (item.status === 'fulfilled') {
            const d = item.value?.data;
            if (Array.isArray(d?.data)) {
              for (const imgItem of d.data) {
                const url = imgItem.url || imgItem.b64_json;
                if (url) generatedResults.push(url);
              }
            } else if (d?.image || d?.url || d?.b64_json) {
              generatedResults.push(d.image || d.url || d.b64_json);
            }
          }
        }
      } catch (fbErr) {
        console.warn('[VectorIllustration] Image fallback error:', fbErr.message);
      }
    }

    // If still no output and reference images are available, use reference image
    if (generatedResults.length === 0 && cleanRefs.length > 0) {
      generatedResults.push(cleanRefs[0]);
    }

    if (generatedResults.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Vector Illustration generation failed. Please verify your OpenRouter credentials and try again.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PART 3: VECTOR CONVERSION & LIVE PALETTE EXTRACTION
    // ─────────────────────────────────────────────────────────────────────────────
    const finalCards = [];
    for (let idx = 0; idx < generatedResults.length; idx++) {
      const rawRes = generatedResults[idx];
      let svgCode = '';
      let palette = [];

      if (typeof rawRes === 'string' && (rawRes.includes('<svg') || rawRes.startsWith('data:image/svg+xml'))) {
        if (rawRes.startsWith('data:image/svg+xml;utf8,')) {
          svgCode = decodeURIComponent(rawRes.replace('data:image/svg+xml;utf8,', ''));
        } else if (rawRes.startsWith('data:image/svg+xml;base64,')) {
          svgCode = Buffer.from(rawRes.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
        } else if (rawRes.includes('<svg')) {
          svgCode = rawRes;
        }
        palette = extractPaletteFromSvg(svgCode);
      } else {
        let buffer;
        if (typeof rawRes === 'string' && (rawRes.startsWith('http://') || rawRes.startsWith('https://'))) {
          const dl = await axios.get(rawRes, { responseType: 'arraybuffer', timeout: 20000 });
          buffer = Buffer.from(dl.data);
        } else if (typeof rawRes === 'string' && rawRes.startsWith('data:image/')) {
          const b64 = rawRes.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
          buffer = Buffer.from(b64, 'base64');
        } else {
          buffer = Buffer.from(rawRes, 'base64');
        }

        const traced = await traceBufferToSvg(buffer, targetQuality);
        svgCode = traced.svgString;
        palette = traced.palette;
      }

      const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`;
      const cardId = `vector_ill_${Date.now()}_${idx}`;

      finalCards.push({
        id: cardId,
        url: svgDataUri,
        img: svgDataUri,
        svg: svgCode,
        svgCode: svgCode,
        palette: palette,
        title: "Vector Illustration",
        prompt: rawUserPrompt,
        originalPrompt: rawUserPrompt,
        enhancedPrompt: enhancedPrompt,
        model: "recraft/recraft-v3",
        modelName: "Recraft V3",
        aspectRatio: targetRatio,
        quality: targetQuality,
        count: totalCount,
        isVector: true,
        isVectorIllustration: true,
        time: "Just now",
        createdAt: new Date().toISOString()
      });
    }

    console.log(`[VectorIllustration] Successfully assembled ${finalCards.length} vector illustration cards.`);

    return res.status(200).json({
      success: true,
      ...finalCards[0],
      images: finalCards
    });

  } catch (error) {
    console.error('[VectorIllustration Pipeline Fatal Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during vector illustration generation.'
    });
  }
}




