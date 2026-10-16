import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Exact OpenRouter Dedicated Image API Model Mapping.
 * Maps dropdown model IDs and names to the official OpenRouter model IDs.
 */
export const OPENROUTER_IMAGE_MODEL_MAP = {
  'openai/gpt-image-2.5-sunburst': 'openai/gpt-image-2.5-sunburst',
  'google/gemini-3-pro-image': 'google/gemini-3-pro-image',
  'google/nano-banana-pro': 'google/gemini-3-pro-image',
  'black-forest-labs/flux.2-pro': 'black-forest-labs/flux.2-pro',
  'bytedance-seed/seedream-5.0-pro': 'bytedance-seed/seedream-5.0-pro',
  'meta/muse-image': 'meta/muse-image',
  'google/gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image-preview',
  'google/nano-banana-2': 'google/gemini-3.1-flash-image-preview'
};

export const MODEL_NAME_TO_ID = {
  'GPT Image 2.5 Sunburst': 'openai/gpt-image-2.5-sunburst',
  'Nano Banana Pro (Gemini 3 Pro Image)': 'google/gemini-3-pro-image',
  'FLUX.2 Pro': 'black-forest-labs/flux.2-pro',
  'Seedream 5.0 Pro': 'bytedance-seed/seedream-5.0-pro',
  'Meta: Muse Image': 'meta/muse-image',
  'Nano Banana 2 (Gemini 3.1 Flash Image)': 'google/gemini-3.1-flash-image-preview'
};

export const MODEL_ID_TO_DISPLAY_NAME = {
  'openai/gpt-image-2.5-sunburst': 'GPT Image 2.5 Sunburst',
  'google/gemini-3-pro-image': 'Nano Banana Pro (Gemini 3 Pro Image)',
  'google/nano-banana-pro': 'Nano Banana Pro (Gemini 3 Pro Image)',
  'black-forest-labs/flux.2-pro': 'FLUX.2 Pro',
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
 * Aspect Ratio to Dimension mapping
 */
export const ASPECT_RATIO_DIMENSIONS = {
  '1:1': { width: 1024, height: 1024, aspect_ratio: '1:1' },
  '16:9': { width: 1344, height: 768, aspect_ratio: '16:9' },
  '9:16': { width: 768, height: 1344, aspect_ratio: '9:16' },
  '4:3': { width: 1152, height: 864, aspect_ratio: '4:3' },
  '3:4': { width: 864, height: 1152, aspect_ratio: '3:4' }
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
 * Controller for POST /api/generate-image
 */
export async function generateImage(req, res) {
  const requestId = req.id || `req_img_${Date.now()}`;
  const apiKey = process.env.OPENROUTER_API_KEY || config.openrouter.apiKey;

  if (!apiKey) {
    logger.error('OpenRouter API key is missing for dedicated image generation', { requestId });
    return res.status(500).json({
      error: true,
      message: 'Server configuration error: OpenRouter API key is not configured.'
    });
  }

  const {
    prompt,
    model,
    aspectRatio = '1:1',
    count = 1,
    imageCount,
    templateStyle,
    template
  } = req.body;

  // Validate prompt
  const rawPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  if (!rawPrompt) {
    return res.status(400).json({
      error: true,
      message: 'Prompt is required for image generation.'
    });
  }

  // Seamlessly combine prompt with active template style tokens if present
  let finalPrompt = rawPrompt;
  const activeStyle = (templateStyle || template || '').trim();
  if (activeStyle && !finalPrompt.toLowerCase().includes(activeStyle.toLowerCase())) {
    finalPrompt = `${finalPrompt}, ${activeStyle} aesthetic, highly detailed, photorealistic`;
  }

  // Resolve OpenRouter Model ID
  const selectedModelId = resolveOpenRouterImageModel(model);
  const displayName = MODEL_ID_TO_DISPLAY_NAME[selectedModelId] || MODEL_ID_TO_DISPLAY_NAME[model] || selectedModelId;
  const dimensions = resolveDimensions(aspectRatio);
  const totalCount = Math.min(Math.max(parseInt(imageCount || count || 1, 10), 1), 4);

  logger.info('Processing Image Workspace generation request', {
    requestId,
    model: selectedModelId,
    displayName,
    aspectRatio,
    count: totalCount,
    promptLength: finalPrompt.length
  });

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AI Mestrio'
  };

  const payload = {
    model: selectedModelId,
    prompt: finalPrompt,
    size: `${dimensions.width}x${dimensions.height}`,
    width: dimensions.width,
    height: dimensions.height,
    aspect_ratio: dimensions.aspect_ratio
  };

  try {
    // Execute concurrent generation requests for batch (count = 1, 2, or 4)
    const requestTasks = Array.from({ length: totalCount }, () =>
      axios.post('https://openrouter.ai/api/v1/images', payload, {
        headers,
        timeout: 60000
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
      model: selectedModelId,
      modelName: displayName,
      aspectRatio,
      createdAt: nowIso
    }));

    logger.info('Image generation request fulfilled successfully', {
      requestId,
      count: images.length,
      model: selectedModelId
    });

    return res.json({
      success: true,
      images,
      count: images.length,
      model: selectedModelId,
      aspectRatio
    });

  } catch (err) {
    const errData = err.response?.data;
    const statusCode = err.response?.status || 500;
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
