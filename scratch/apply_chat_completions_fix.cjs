const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server', 'src', 'controllers', 'imageController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Locate start of enhancePreciseEditPromptWithMahiEngine
const startMarker = '/**\n * STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)';
const altStartMarker = '/**\r\n * STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)';

let startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  startIndex = content.indexOf(altStartMarker);
}

if (startIndex === -1) {
  console.error('Could not find start marker!');
  process.exit(1);
}

const before = content.slice(0, startIndex);

const replacementCode = `/**
 * STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)
 * Sends sourceImage, referenceImages, and instructionPrompt to Mahi Engine (via Gemini 2.5 Flash / chat completions).
 * Returns an ultra-detailed studio-grade inpainting prompt ensuring all unmentioned elements, background,
 * character anatomy, lighting, and composition stay 100% identical, specifying ONLY the requested visual changes.
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

  const systemInstruction = \`You are Mahi Engine, an expert Inpainting and Precision Image Synthesis Prompt Engineer.
You are given a primary source image, optional reference image(s), and a user edit request.
Analyze the source image (composition, subject identity, textures, background details, lighting, perspective, colors).
Generate an ultra-detailed studio-grade inpainting prompt that enforces:
1. Visual Preservation: All unmentioned background elements, character anatomy, clothing, scenery, lighting, and composition must remain 100% identical to the source image.
2. Localized Precision: Translate the user's edit instruction into explicit, detailed physical modifications. Specify ONLY the requested visual changes.
3. If reference images are supplied, explicitly integrate reference features, colors, or style elements into the modified area.
Output ONLY the hyper-detailed inpainting prompt without any preamble, markdown code blocks, conversational text, or quotes.\`;

  const qualityModifier = typeof quality === 'string' && quality.toLowerCase() === 'high'
    ? ' (ultra-detailed, 8k resolution, razor-sharp focus)'
    : '';

  const promptText = \`Primary Source Image and User Edit Request:
"\${trimmed}"\${qualityModifier}
Analyze the primary source image and any reference images. Ensure all unmentioned elements, background, character anatomy, lighting, and composition stay 100% identical to the source image, and specify ONLY the requested visual changes.\`;

  const content = [{ type: 'text', text: promptText }];

  const formattedSource = formatImageUrlForVision(sourceImage);
  if (formattedSource) {
    content.push({ type: 'image_url', image_url: { url: formattedSource } });
  }

  if (Array.isArray(referenceImages)) {
    referenceImages.forEach((ref) => {
      const formattedRef = formatImageUrlForVision(ref);
      if (formattedRef && formattedRef !== formattedSource) {
        content.push({ type: 'image_url', image_url: { url: formattedRef } });
      }
    });
  }

  if (apiKey) {
    const visionModels = ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-001', 'openai/gpt-4o-mini'];
    for (const visionModel of visionModels) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: visionModel,
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
              'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:3000',
              'X-Title': 'Mestrio AI'
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
              model: visionModel,
              originalLength: trimmed.length,
              refinedLength: cleaned.length
            });
            return cleaned;
          }
        }
      } catch (err) {
        logger.warn(\`Mahi Engine vision prompt refinement failed on \${visionModel}\`, {
          requestId,
          error: err.response?.data?.error?.message || err.message
        });
      }
    }
  }

  // Resilient fallback prompt preserving background and subjects
  return \`\${trimmed}, modifying the source image while visually preserving background composition, lighting, textures, character anatomy, and subject identity 100% identical, clear fidelity, sharp focus\`;
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
        success: false,
        error: 'Server configuration error: OpenRouter API key is not configured.'
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
        success: false,
        error: 'Edit instruction ("What should change?") is required.'
      });
    }

    const formattedSource = formatImageUrlForVision(sourceImage);
    if (!formattedSource) {
      return res.status(400).json({
        success: false,
        error: 'A valid primary source image is required for Precise Edit.'
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

    logger.info('Starting Two-Stage Precise Edit execution via Chat Completions endpoint', {
      requestId,
      variations: variationsCount,
      quality,
      instructionLength: rawInstruction.length,
      hasSource: Boolean(formattedSource),
      referenceCount: validRefs.length
    });

    // -------------------------------------------------------------------------
    // STAGE 1: MAHI ENGINE (VISION REASONING & PRESERVATION PROMPT EXPANSION)
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
    // STAGE 2: FLUX.2 FLEX SYNTHESIS VIA OPENROUTER STANDARD CHAT COMPLETIONS API
    // -------------------------------------------------------------------------
    const targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const requestHeaders = {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:3000',
      'X-Title': 'Mestrio AI'
    };

    // Construct user content with refined prompt text and primary source image
    const messageContent = [
      { type: 'text', text: refinedPrompt },
      { type: 'image_url', image_url: { url: formattedSource } }
    ];

    // Append any reference images as additional image_url content blocks
    validRefs.forEach(refUrl => {
      messageContent.push({
        type: 'image_url',
        image_url: { url: refUrl }
      });
    });

    const fluxPayload = {
      model: 'black-forest-labs/flux.2-flex',
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    };

    console.log('[FLUX.2 Flex Chat Completions Request Payload]:', {
      endpoint: targetUrl,
      model: fluxPayload.model,
      promptLength: refinedPrompt.length,
      hasSource: Boolean(formattedSource),
      sourcePrefix: formattedSource ? formattedSource.slice(0, 45) + '...' : null,
      refCount: validRefs.length,
      variations: variationsCount
    });

    // Single variation: execute direct single call
    if (variationsCount === 1) {
      let fluxResponse;
      let rawResponseText = '';
      try {
        fluxResponse = await fetch(targetUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(fluxPayload)
        });
        rawResponseText = await fluxResponse.text();
      } catch (netErr) {
        logger.error('Failed to connect to OpenRouter Chat Completions API', { error: netErr.message });
        return res.status(502).json({
          success: false,
          error: \`Unable to reach OpenRouter API: \${netErr.message}. Please check your network connection or API status.\`
        });
      }

      console.log(\`[OpenRouter FLUX.2 Chat Response HTTP \${fluxResponse.status}]:\`, rawResponseText.slice(0, 500));

      let data = null;
      try {
        data = JSON.parse(rawResponseText);
      } catch (jsonErr) {
        console.error('Failed to parse OpenRouter response as JSON:', jsonErr.message);
      }

      // If 404 "No model found" for flux.2-flex, attempt fallback to black-forest-labs/flux.2-pro
      if (!fluxResponse.ok && fluxResponse.status === 404 && rawResponseText.includes('No model found')) {
        logger.warn('FLUX.2 Flex returned 404, attempting fallback to black-forest-labs/flux.2-pro', { requestId });
        try {
          const fallbackPayload = {
            ...fluxPayload,
            model: 'black-forest-labs/flux.2-pro'
          };
          const fallbackResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(fallbackPayload)
          });
          const fallbackText = await fallbackResponse.text();
          console.log(\`[OpenRouter Fallback HTTP \${fallbackResponse.status}]:\`, fallbackText.slice(0, 500));
          if (fallbackResponse.ok) {
            fluxResponse = fallbackResponse;
            rawResponseText = fallbackText;
            data = JSON.parse(fallbackText);
          }
        } catch (_) {}
      }

      // Sanitize server response & extract human-readable error message
      if (!fluxResponse.ok) {
        const rawError = data?.error;
        const errorMessage = typeof rawError === 'string'
          ? rawError
          : rawError?.message || data?.message || (rawResponseText && rawResponseText.length < 500 ? rawResponseText : 'FLUX.2 generation failed');

        console.error('OpenRouter Detailed Error:', JSON.stringify(data || rawResponseText, null, 2));
        return res.status(fluxResponse.status || 500).json({
          success: false,
          error: errorMessage
        });
      }

      const extractedUrls = extractImagesFromChatCompletion(data);

      if (extractedUrls.length === 0) {
        const rawContent = data?.choices?.[0]?.message?.content;
        const rawError = data?.error;
        const errorMessage = typeof rawError === 'string'
          ? rawError
          : rawError?.message || (typeof rawContent === 'string' && rawContent.length < 250 ? rawContent : 'FLUX.2 Flex did not return an image. Please try again.');

        console.error('OpenRouter Chat Response Contained No Image URLs:', JSON.stringify(data || rawResponseText, null, 2));
        return res.status(500).json({
          success: false,
          error: errorMessage
        });
      }

      const formattedImages = extractedUrls.slice(0, 1).map((url, idx) => ({
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
        variations: 1,
        createdAt: new Date().toISOString()
      }));

      return res.json({
        success: true,
        images: formattedImages,
        count: formattedImages.length,
        refinedPrompt,
        model: 'black-forest-labs/flux.2-flex',
        modelName: 'FLUX.2 Flex'
      });
    }

    // Multiple variations: execute concurrent Promise.all calls matching variation count (1 to 4)
    const generationTasks = Array.from({ length: variationsCount }, async () => {
      try {
        let response = await fetch(targetUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(fluxPayload)
        });

        let rawText = await response.text();
        let parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch (_) {}

        if (!response.ok && response.status === 404 && rawText.includes('No model found')) {
          response = await fetch(targetUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({
              ...fluxPayload,
              model: 'black-forest-labs/flux.2-pro'
            })
          });
          rawText = await response.text();
          try {
            parsed = JSON.parse(rawText);
          } catch (_) {}
        }

        return {
          status: response.status,
          ok: response.ok,
          data: parsed,
          rawText
        };
      } catch (err) {
        return {
          status: 500,
          ok: false,
          data: null,
          rawText: err.message
        };
      }
    });

    const results = await Promise.all(generationTasks);
    const collectedUrls = [];
    let firstError = null;

    for (const item of results) {
      if (item.ok && item.data) {
        const urls = extractImagesFromChatCompletion(item.data);
        for (const u of urls) {
          if (u && !collectedUrls.includes(u)) {
            collectedUrls.push(u);
          }
        }
      } else if (!firstError) {
        firstError = item;
      }
    }

    if (collectedUrls.length === 0) {
      const rawError = firstError?.data?.error;
      const errorMessage = typeof rawError === 'string'
        ? rawError
        : rawError?.message || firstError?.data?.message || firstError?.rawText || 'FLUX.2 Flex generation failed';

      console.error('OpenRouter Detailed Error:', JSON.stringify(firstError?.data || firstError?.rawText, null, 2));
      return res.status(firstError?.status || 500).json({
        success: false,
        error: errorMessage
      });
    }

    const nowIso = new Date().toISOString();
    const images = collectedUrls.slice(0, variationsCount).map((url, idx) => ({
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

    return res.json({
      success: true,
      images,
      count: images.length,
      refinedPrompt,
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
      success: false,
      error: err.message || 'Internal server error during Precise Edit synthesis.'
    });
  }
}
`;

fs.writeFileSync(filePath, before + replacementCode, 'utf8');
console.log('Successfully updated imageController.js with Chat Completions execution!');

