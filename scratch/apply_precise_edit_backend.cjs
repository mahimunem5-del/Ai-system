// scratch/apply_precise_edit_backend.cjs
const fs = require('fs');

console.log('=== APPLYING TWO-STAGE PRECISE EDIT BACKEND IMPLEMENTATION ===\n');

// 1. UPDATE routes/image.js
let routesCode = fs.readFileSync('server/src/routes/image.js', 'utf8');
if (!routesCode.includes('executePreciseEdit')) {
  routesCode = routesCode.replace(
    "import { generateImage } from '../controllers/imageController.js';",
    "import { generateImage, executePreciseEdit } from '../controllers/imageController.js';"
  );
  routesCode = routesCode.replace(
    "router.post('/generate', generateImage);",
    "router.post('/generate', generateImage);\nrouter.post('/precise-edit', executePreciseEdit);"
  );
  fs.writeFileSync('server/src/routes/image.js', routesCode, 'utf8');
  console.log('✓ Updated server/src/routes/image.js with /precise-edit route');
} else {
  console.log('- server/src/routes/image.js already contains executePreciseEdit');
}

// 2. UPDATE controllers/imageController.js
let controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// A. Add flux.2-flex to model maps if not present
if (!controllerCode.includes('black-forest-labs/flux.2-flex')) {
  controllerCode = controllerCode.replace(
    "'black-forest-labs/flux.2-pro': 'black-forest-labs/flux.2-pro',",
    "'black-forest-labs/flux.2-pro': 'black-forest-labs/flux.2-pro',\n  'black-forest-labs/flux.2-flex': 'black-forest-labs/flux.2-flex',"
  );
  controllerCode = controllerCode.replace(
    "'FLUX.2 Pro': 'black-forest-labs/flux.2-pro',",
    "'FLUX.2 Pro': 'black-forest-labs/flux.2-pro',\n  'FLUX.2 Flex': 'black-forest-labs/flux.2-flex',"
  );
  controllerCode = controllerCode.replace(
    "'black-forest-labs/flux.2-pro': 'FLUX.2 Pro',",
    "'black-forest-labs/flux.2-pro': 'FLUX.2 Pro',\n  'black-forest-labs/flux.2-flex': 'FLUX.2 Flex',"
  );
  console.log('✓ Added black-forest-labs/flux.2-flex to model maps');
}

// B. Append Stage 1 and Stage 2 functions if not present
if (!controllerCode.includes('export async function executePreciseEdit')) {
  const preciseEditImpl = `

/**
 * ============================================================================
 * TWO-STAGE "PRECISE EDIT" PIPELINE (MAHI ENGINE + FLUX.2 FLEX VIA OPENROUTER)
 * ============================================================================
 */

/**
 * STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)
 * Sends sourceImage, referenceImages, and instructionPrompt to Mahi Engine (via OpenRouter chat/vision gateway).
 * Returns an ultra-detailed studio-grade diffusion prompt enforcing visual preservation and localized precision.
 */
export async function enhancePreciseEditPromptWithMahiEngine(
  sourceImage,
  referenceImages = [],
  instructionPrompt = '',
  apiKey = '',
  requestId = '',
  quality = 'Medium'
) {
  const trimmed = typeof instructionPrompt === 'string' ? instructionPrompt.trim() : '';
  if (!trimmed) return '';

  const systemInstruction = \`You are an expert Inpainting and Precision Image Synthesis Prompt Engineer.
You are given a primary source image and a user edit request.
Analyze the source image (composition, subject identity, textures, background details, lighting, perspective).
Generate an ultra-detailed studio-grade diffusion prompt that enforces:
1. Visual Preservation: All unmentioned background assets, lighting, secondary characters, scenery, and composition must remain 100% identical to the source image.
2. Localized Precision: Translate the user's edit instruction into explicit, detailed physical modifications.
3. If reference images are supplied, explicitly describe how reference features or style elements should be integrated into the modified area.
Output ONLY the refined synthesis prompt string without preamble, conversational text, or quotes.\`;

  const qualityModifier = typeof quality === 'string' && quality.toLowerCase() === 'high'
    ? ' (ultra-detailed, 8k resolution, razor-sharp focus)'
    : '';

  const promptText = \`Primary Source Image and User Edit Request:\n"\${trimmed}"\${qualityModifier}\nAnalyze the primary source image and any reference images, then synthesize the comprehensive diffusion prompt enforcing visual preservation and localized precision.\`;

  const content = [{ type: 'text', text: promptText }];

  const formattedSource = formatImageUrlForVision(sourceImage);
  if (formattedSource) {
    content.push({ type: 'text', text: 'Primary source image to be edited:' });
    content.push({ type: 'image_url', image_url: { url: formattedSource } });
  }

  if (Array.isArray(referenceImages)) {
    referenceImages.forEach((ref, idx) => {
      const formattedRef = formatImageUrlForVision(ref);
      if (formattedRef && formattedRef !== formattedSource) {
        content.push({ type: 'text', text: \`Reference image \${idx + 1} (style/visual guide):\` });
        content.push({ type: 'image_url', image_url: { url: formattedRef } });
      }
    });
  }

  if (apiKey) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: content }
          ],
          temperature: 0.5,
          max_tokens: 600
        },
        {
          headers: {
            'Authorization': \`Bearer \${apiKey}\`,
            'Content-Type': 'application/json',
            'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
            'X-Title': config.openrouter.siteName || 'Mestrio AI'
          },
          timeout: 20000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      const refined = response.data?.choices?.[0]?.message?.content?.trim();
      if (refined && refined.length > 0) {
        const cleaned = refined.replace(/^["'\`]+|["'\`]+$/g, '').trim();
        if (cleaned.length > 0) {
          logger.info('Mahi Engine synthesized precise edit prompt successfully', {
            requestId,
            originalLength: trimmed.length,
            refinedLength: cleaned.length
          });
          return cleaned;
        }
      }
    } catch (err) {
      logger.warn('Mahi Engine vision prompt refinement failed or timed out, using fallback synthesis prompt', {
        requestId,
        error: err.response?.data?.error?.message || err.message
      });
    }
  }

  // Resilient fallback prompt preserving background and subjects
  return \`\${trimmed}, modifying the source image while visually preserving background composition, lighting, textures, and subject identity, clear fidelity, sharp focus\`;
}

/**
 * Controller for POST /api/images/precise-edit
 * Also callable as POST /api/generate-image/precise-edit
 */
export async function executePreciseEdit(req, res) {
  const requestId = req.id || \`req_pedit_\${Date.now()}\`;
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || config.openrouter.apiKey;

    if (!apiKey) {
      logger.error('OpenRouter API key is missing for precise edit', { requestId });
      return res.status(500).json({
        error: true,
        message: 'Server configuration error: OpenRouter API key is not configured.'
      });
    }

    const {
      sourceImage,
      referenceImages = [],
      instructionPrompt,
      prompt,
      variations = 1,
      count,
      quality = 'Medium',
      aspectRatio = '1:1'
    } = req.body || {};

    const rawInstruction = (instructionPrompt || prompt || '').trim();
    if (!rawInstruction) {
      return res.status(400).json({
        error: true,
        message: 'Edit instruction ("What should change?") is required.'
      });
    }

    const formattedSource = formatImageUrlForVision(sourceImage);
    if (!formattedSource) {
      return res.status(400).json({
        error: true,
        message: 'A valid primary source image is required for Precise Edit.'
      });
    }

    let rawRefs = [];
    if (Array.isArray(referenceImages)) {
      rawRefs = referenceImages.map(r => (typeof r === 'string' ? r : (r?.dataUrl || r?.url || r?.image || '')));
    } else if (typeof referenceImages === 'string' && referenceImages.trim()) {
      rawRefs = [referenceImages];
    }
    const validRefs = rawRefs
      .map(r => formatImageUrlForVision(r))
      .filter(r => r && r !== formattedSource)
      .slice(0, 10);

    const variationsCount = Math.min(Math.max(parseInt(variations || count || 1, 10), 1), 4);

    logger.info('Starting Two-Stage Precise Edit execution', {
      requestId,
      variations: variationsCount,
      quality,
      instructionLength: rawInstruction.length,
      hasSource: Boolean(formattedSource),
      referenceCount: validRefs.length
    });

    // -------------------------------------------------------------------------
    // STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)
    // -------------------------------------------------------------------------
    const refinedPrompt = await enhancePreciseEditPromptWithMahiEngine(
      formattedSource,
      validRefs,
      rawInstruction,
      apiKey,
      requestId,
      quality
    );

    // -------------------------------------------------------------------------
    // STAGE 2: FLUX.2 FLEX SYNTHESIS VIA OPENROUTER IMAGE API
    // -------------------------------------------------------------------------
    const targetUrl = 'https://openrouter.ai/api/v1/images';
    const headers = {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
      'X-Title': config.openrouter.siteName || 'Mestrio AI'
    };

    const basePayload = {
      model: 'black-forest-labs/flux.2-flex',
      prompt: refinedPrompt,
      image: formattedSource,
      source_image: formattedSource,
      init_image: formattedSource,
      image_references: validRefs,
      reference_images: validRefs,
      n: 1
    };

    logger.info('Dispatching FLUX.2 Flex synthesis to OpenRouter dedicated Image API (/api/v1/images)', {
      requestId,
      model: basePayload.model,
      promptLength: refinedPrompt.length,
      variations: variationsCount
    });

    // Execute Promise.all for requested variation count (1 to 4) concurrently
    const generationTasks = Array.from({ length: variationsCount }, async (_, idx) => {
      try {
        let response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(basePayload)
        });

        let rawResponseText = await response.text();

        // If 404 "No model found" returned for black-forest-labs/flux.2-flex, gracefully attempt fallback
        if (response.status === 404 && rawResponseText.includes('No model found')) {
          logger.warn('FLUX.2 Flex slug returned 404, attempting fallback to black-forest-labs/flux.2-pro', { requestId });
          const fallbackPayload = {
            ...basePayload,
            model: 'black-forest-labs/flux.2-pro'
          };
          response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(fallbackPayload)
          });
          rawResponseText = await response.text();
        }

        let parsedData = null;
        try {
          parsedData = JSON.parse(rawResponseText);
        } catch (jsonErr) {
          logger.error('Failed to parse OpenRouter FLUX response as JSON', { error: jsonErr.message });
        }

        return {
          status: response.status,
          ok: response.ok,
          data: parsedData,
          rawText: rawResponseText
        };
      } catch (fetchErr) {
        logger.error('FLUX.2 Flex fetch task failed with network error', { error: fetchErr.message });
        return {
          status: 500,
          ok: false,
          data: null,
          rawText: fetchErr.message
        };
      }
    });

    const results = await Promise.all(generationTasks);
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
        'FLUX.2 Flex image generation failed. Please verify OpenRouter API limits or prompt.';

      logger.error('Two-Stage Precise Edit failed to synthesize images', {
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
    const images = generatedUrls.slice(0, variationsCount).map((url, idx) => ({
      id: \`img_\${Date.now()}_\${idx}\`,
      url,
      prompt: refinedPrompt,
      originalPrompt: rawInstruction,
      model: 'black-forest-labs/flux.2-flex',
      modelName: 'FLUX.2 Flex',
      aspectRatio,
      isPreciseEdit: true,
      sourceImage: formattedSource,
      referenceImages: validRefs,
      variations: variationsCount,
      createdAt: nowIso
    }));

    logger.info('Two-Stage Precise Edit fulfilled successfully', {
      requestId,
      count: images.length,
      variations: variationsCount
    });

    return res.json({
      success: true,
      images,
      refinedPrompt,
      count: images.length,
      model: 'black-forest-labs/flux.2-flex',
      modelName: 'FLUX.2 Flex'
    });
  } catch (err) {
    logger.error('Unexpected error in executePreciseEdit', {
      requestId,
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({
      error: true,
      message: err.message || 'Internal server error during Precise Edit synthesis.'
    });
  }
}
`;
  controllerCode += preciseEditImpl;
  fs.writeFileSync('server/src/controllers/imageController.js', controllerCode, 'utf8');
  console.log('✓ Added enhancePreciseEditPromptWithMahiEngine and executePreciseEdit to controllers/imageController.js');
}

console.log('\n=== BACKEND IMPLEMENTATION APPLIED SUCCESSFULLY ===');

