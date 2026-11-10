const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. UPDATE server/src/index.js
// ============================================================================
const indexPath = path.join(__dirname, '..', 'server', 'src', 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Ensure executePreciseEdit is imported
if (!indexContent.includes('executePreciseEdit')) {
  indexContent = indexContent.replace(
    "import imageRouter from './routes/image.js';",
    "import imageRouter from './routes/image.js';\nimport { executePreciseEdit } from './controllers/imageController.js';"
  );
}

// Add route mounts
const oldMounts = `app.use('/api/generate-image', imageRouter);
app.use('/api/images', imageRouter);`;

const newMounts = `app.use('/api/generate-image', imageRouter);
app.use('/api/images', imageRouter);
app.use('/api/image', imageRouter);

// Explicit aliases for Precise Edit to prevent any 404 path mismatch
app.post('/api/images/precise-edit', executePreciseEdit);
app.post('/api/image/precise-edit', executePreciseEdit);
app.post('/api/generate-image/precise-edit', executePreciseEdit);
app.post('/api/images/edit', executePreciseEdit);`;

if (indexContent.includes(oldMounts)) {
  indexContent = indexContent.replace(oldMounts, newMounts);
} else if (indexContent.includes(oldMounts.replace(/\n/g, '\r\n'))) {
  indexContent = indexContent.replace(oldMounts.replace(/\n/g, '\r\n'), newMounts.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✓ Updated server/src/index.js with robust route mounts and aliases');

// ============================================================================
// 2. UPDATE server/src/routes/image.js
// ============================================================================
const routesPath = path.join(__dirname, '..', 'server', 'src', 'routes', 'image.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');

if (!routesContent.includes("router.post('/edit', executePreciseEdit);")) {
  routesContent = routesContent.replace(
    "router.post('/precise-edit', executePreciseEdit);",
    "router.post('/precise-edit', executePreciseEdit);\nrouter.post('/edit', executePreciseEdit);"
  );
  fs.writeFileSync(routesPath, routesContent, 'utf8');
  console.log('✓ Updated server/src/routes/image.js with edit alias');
}

// ============================================================================
// 3. UPDATE server/src/controllers/imageController.js
// ============================================================================
const controllerPath = path.join(__dirname, '..', 'server', 'src', 'controllers', 'imageController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Locate start of enhancePreciseEditPromptWithMahiEngine
const startMarker = '/**\n * STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)';
const altStartMarker = '/**\r\n * STAGE 1: MAHI ENGINE (VISION REASONING & PROMPT EXPANSION)';

let startIndex = controllerContent.indexOf(startMarker);
if (startIndex === -1) {
  startIndex = controllerContent.indexOf(altStartMarker);
}

if (startIndex === -1) {
  console.error('Could not find start marker in imageController.js');
  process.exit(1);
}

const beforeController = controllerContent.slice(0, startIndex);

const productionPipelineCode = `/**
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

  const systemInstruction = \`You are an expert Inpainting and Image-to-Image Prompt Engineer.
Analyze the provided source image (composition, subject identity, colors, background details, lighting).
Generate an ultra-detailed studio-grade diffusion prompt that enforces:
1. Visual Preservation: All unmentioned background elements, scenery, architecture, character identity, and scene lighting must remain 100% identical to the source image.
2. Localized Precision: Translate the user's edit instruction into explicit, detailed physical modifications.
3. If reference images are provided, explicitly describe how reference visual style/features should be integrated into the modified area.
Output ONLY the final refined synthesis prompt string without preamble, conversational text, or quotes.\`;

  const qualityModifier = typeof quality === 'string' && quality.toLowerCase() === 'high'
    ? ' (ultra-detailed, 8k resolution, razor-sharp focus)'
    : '';

  const promptText = \`Primary Source Image and User Edit Request:
"\${trimmed}"\${qualityModifier}
Analyze the provided source image, preserve all unmentioned elements, scenery, architecture, character identity, and scene lighting 100% identical to the source image, and translate the user's edit instruction into explicit, detailed physical modifications.\`;

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
  return \`\${trimmed}, modifying the source image while visually preserving background elements, scenery, architecture, character identity, and scene lighting 100% identical, clear fidelity, sharp focus\`;
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
    // STAGE 2: PRODUCTION IMAGE GENERATION VIA OPENROUTER STANDARD CHAT COMPLETIONS API
    // (With full resilient fallback chain to ensure studio-grade synthesis never fails)
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

    // Models priority list: User preferred FLUX.2 Flex -> FLUX.2 Pro -> Gemini Flash Image -> Nano Banana 2 -> GPT Image
    const modelsToTry = [
      { id: 'black-forest-labs/flux.2-flex', name: 'FLUX.2 Flex' },
      { id: 'black-forest-labs/flux.2-pro', name: 'FLUX.2 Pro' },
      { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
      { id: 'google/gemini-3.1-flash-image-preview', name: 'Nano Banana 2' },
      { id: 'openai/gpt-image-2.5-sunburst', name: 'GPT Image 2.5 Sunburst' }
    ];

    let successfulModel = null;
    let successfulModelName = null;
    let collectedUrls = [];
    let lastErrorDetails = null;

    for (const candidate of modelsToTry) {
      const isGemini = candidate.id.includes('gemini');
      const payload = {
        model: candidate.id,
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        ...(isGemini ? { modalities: ['image', 'text'] } : {})
      };

      console.log(\`[PreciseEdit Debug] Dispatching to \${candidate.id} via \${targetUrl}...\`);

      // Execute concurrent requests for requested variations (1 to 4)
      const tasks = Array.from({ length: variationsCount }, async () => {
        try {
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(payload)
          });

          const rawText = await res.text();
          console.log('[PreciseEdit Debug] URL:', targetUrl, 'Status:', res.status, 'Body:', rawText.slice(0, 400));

          let data = null;
          try {
            data = JSON.parse(rawText);
          } catch (_) {}

          return {
            ok: res.ok,
            status: res.status,
            data,
            rawText
          };
        } catch (fetchErr) {
          console.error(\`[PreciseEdit Debug] Network fetch error for \${candidate.id}:\`, fetchErr.message);
          return {
            ok: false,
            status: 502,
            data: null,
            rawText: fetchErr.message
          };
        }
      });

      const batchResults = await Promise.all(tasks);
      const batchUrls = [];
      let batchFailure = null;

      for (const item of batchResults) {
        if (item.ok && item.data) {
          const urls = extractImagesFromChatCompletion(item.data);
          for (const u of urls) {
            if (u && !batchUrls.includes(u)) {
              batchUrls.push(u);
            }
          }
        } else if (!batchFailure) {
          batchFailure = item;
        }
      }

      if (batchUrls.length > 0) {
        successfulModel = candidate.id;
        successfulModelName = candidate.name;
        collectedUrls = batchUrls;
        logger.info(\`Precise Edit fulfilled successfully with \${candidate.name}\`, {
          requestId,
          model: candidate.id,
          count: batchUrls.length
        });
        break; // Successfully synthesized!
      }

      lastErrorDetails = batchFailure;

      // If the error is authentication (401) or out-of-credits (402), don't keep trying models
      if (batchFailure && (batchFailure.status === 401 || batchFailure.status === 402)) {
        break;
      }
    }

    if (collectedUrls.length === 0) {
      const rawError = lastErrorDetails?.data?.error;
      const errorMessage = typeof rawError === 'string'
        ? rawError
        : rawError?.message || lastErrorDetails?.data?.message || lastErrorDetails?.rawText || 'Image synthesis failed. Please check your OpenRouter API key limits or prompt.';

      console.error('[PreciseEdit Debug] Generation failed completely across model pipeline:', {
        status: lastErrorDetails?.status || 500,
        error: errorMessage
      });

      return res.status(lastErrorDetails?.status || 500).json({
        success: false,
        error: errorMessage
      });
    }

    const nowIso = new Date().toISOString();
    const finalModelId = successfulModel || 'black-forest-labs/flux.2-flex';
    const finalModelName = successfulModelName || 'FLUX.2 Flex';

    const images = collectedUrls.slice(0, variationsCount).map((url, idx) => ({
      id: \`img_\${Date.now()}_\${idx}\`,
      url,
      prompt: refinedPrompt,
      originalPrompt: rawInstruction,
      model: finalModelId,
      modelName: finalModelName,
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
      model: finalModelId,
      modelName: finalModelName
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

fs.writeFileSync(controllerPath, beforeController + productionPipelineCode, 'utf8');
console.log('✓ Updated server/src/controllers/imageController.js with full Two-Stage studio-grade pipeline and debug logs');

// ============================================================================
// 4. UPDATE index.html
// ============================================================================
const htmlPath = path.join(__dirname, '..', 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Update endpoint resolution to try 5001 primary with reliable relative fallback
const oldHtmlEndpoint = `                const isPort5001 = window.location.protocol.startsWith('http') && window.location.port === '5001';
                const apiBase = isPort5001
                    ? ''
                    : (window.location.protocol.startsWith('http') && window.location.hostname
                        ? \`http://\${window.location.hostname}:5001\`
                        : 'http://localhost:5001');

                const endpoint = \`\${apiBase}/api/images/precise-edit\`;`;

const newHtmlEndpoint = `                const host = (window.location.protocol.startsWith('http') && window.location.hostname) ? window.location.hostname : 'localhost';
                const isPort5001 = window.location.protocol.startsWith('http') && window.location.port === '5001';
                const endpoint = isPort5001 ? '/api/images/precise-edit' : \`http://\${host}:5001/api/images/precise-edit\`;`;

if (htmlContent.includes(oldHtmlEndpoint)) {
  htmlContent = htmlContent.replace(oldHtmlEndpoint, newHtmlEndpoint);
} else if (htmlContent.includes(oldHtmlEndpoint.replace(/\n/g, '\r\n'))) {
  htmlContent = htmlContent.replace(oldHtmlEndpoint.replace(/\n/g, '\r\n'), newHtmlEndpoint.replace(/\n/g, '\r\n'));
}

// Update model name dynamically in index.html card creation
const oldCardCreation = `                            model: 'black-forest-labs/flux.2-flex',
                            modelName: 'FLUX.2 Flex',`;

const newCardCreation = `                            model: img.model || data.model || 'black-forest-labs/flux.2-flex',
                            modelName: img.modelName || data.modelName || 'FLUX.2 Flex',`;

if (htmlContent.includes(oldCardCreation)) {
  htmlContent = htmlContent.replace(oldCardCreation, newCardCreation);
} else if (htmlContent.includes(oldCardCreation.replace(/\n/g, '\r\n'))) {
  htmlContent = htmlContent.replace(oldCardCreation.replace(/\n/g, '\r\n'), newCardCreation.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('✓ Updated index.html frontend caller & dynamic model naming');

// ============================================================================
// 5. UPDATE src/components/ImageWorkspace.tsx
// ============================================================================
const tsxPath = path.join(__dirname, '..', 'src', 'components', 'ImageWorkspace.tsx');
let tsxContent = fs.readFileSync(tsxPath, 'utf8');

const oldTsxEndpoint = `        const endpoint = (window.location.port === '5001' || !window.location.port) && window.location.protocol.startsWith('http')
          ? '/api/images/precise-edit'
          : \`http://\${window.location.hostname || 'localhost'}:5001/api/images/precise-edit\`;`;

const newTsxEndpoint = `        const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
        const isPort5001 = typeof window !== 'undefined' && window.location.port === '5001';
        const endpoint = isPort5001 ? '/api/images/precise-edit' : \`http://\${host}:5001/api/images/precise-edit\`;`;

if (tsxContent.includes(oldTsxEndpoint)) {
  tsxContent = tsxContent.replace(oldTsxEndpoint, newTsxEndpoint);
} else if (tsxContent.includes(oldTsxEndpoint.replace(/\n/g, '\r\n'))) {
  tsxContent = tsxContent.replace(oldTsxEndpoint.replace(/\n/g, '\r\n'), newTsxEndpoint.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(tsxPath, tsxContent, 'utf8');
console.log('✓ Updated src/components/ImageWorkspace.tsx caller');

console.log('\n===========================================');
console.log('🎉 ALL PRODUCTION FILES UPDATED SUCCESSFULLY!');
console.log('===========================================');

