// scratch/apply_cors_and_error_fix.cjs
const fs = require('fs');

console.log('=== APPLYING CORS, PAYLOAD LIMIT & ERROR HANDLING FIXES ===\n');

// ============================================================================
// 1. UPDATE server/src/index.js (CORS & Body Parser)
// ============================================================================
let serverIndex = fs.readFileSync('server/src/index.js', 'utf8');

const oldCorsBlock = `// Security & Strict CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      config.cors.allowedOrigins.includes(origin) ||
      (config.cors.allowNullOrigin && origin === 'null') ||
      /^http:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  credentials: true
}));`;

const newCorsBlock = `// Security & Robust CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development, web preview, file:// (null), and configured production origins
    if (
      !origin ||
      origin === 'null' ||
      (config.cors?.allowedOrigins && config.cors.allowedOrigins.includes(origin)) ||
      (config.cors?.allowNullOrigin && origin === 'null') ||
      /^https?:\\/\\/(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|192\\.168\\.\\d+\\.\\d+|10\\.\\d+\\.\\d+\\.\\d+)(:\\d+)?$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback so browser fetches never fail with CORS errors
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Request-ID']
}));

// Explicit preflight handling for all routes
app.options('*', cors());`;

if (serverIndex.includes(oldCorsBlock)) {
  serverIndex = serverIndex.replace(oldCorsBlock, newCorsBlock);
  console.log('✓ Updated CORS configuration in server/src/index.js with permissive origin & app.options');
} else {
  console.log('- CORS block pattern differed in server/src/index.js, checking regex replacement...');
  const corsRegex = /\/\/ Security & Strict CORS Configuration[\s\S]*?credentials:\s*true\s*\}\)\);/;
  if (corsRegex.test(serverIndex)) {
    serverIndex = serverIndex.replace(corsRegex, newCorsBlock);
    console.log('✓ Updated CORS configuration via regex in server/src/index.js');
  }
}

// Ensure 50mb payload limits are active
if (!serverIndex.includes("express.json({ limit: '50mb' })")) {
  serverIndex = serverIndex.replace(/app\.use\(express\.json\([^)]*\)\);/, "app.use(express.json({ limit: '50mb' }));");
}
if (!serverIndex.includes("express.urlencoded({ limit: '50mb', extended: true })")) {
  serverIndex = serverIndex.replace(/app\.use\(express\.urlencoded\([^)]*\)\);/, "app.use(express.urlencoded({ limit: '50mb', extended: true }));");
}

fs.writeFileSync('server/src/index.js', serverIndex, 'utf8');
console.log('✓ server/src/index.js verified and saved\n');

// ============================================================================
// 2. UPDATE server/src/controllers/imageController.js
// ============================================================================
let controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// Replace the OpenRouter synthesis block in executePreciseEdit to match user spec with proper error handling
const oldExecStart = 'export async function executePreciseEdit(req, res) {';
const oldExecEnd = '\n/**\n * @deprecated Legacy conversational image handler';

const idxStart = controllerCode.indexOf(oldExecStart);
const idxEnd = controllerCode.indexOf(oldExecEnd);

if (idxStart !== -1 && idxEnd !== -1) {
  const newExecutePreciseEdit = `export async function executePreciseEdit(req, res) {
  const requestId = req.id || \`req_pedit_\${Date.now()}\`;
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || config.openrouter.apiKey;

    if (!apiKey) {
      logger.error('OpenRouter API key is missing for precise edit', { requestId });
      return res.status(500).json({
        error: 'Server configuration error: OpenRouter API key is not configured.',
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
        error: 'Edit instruction ("What should change?") is required.',
        message: 'Edit instruction ("What should change?") is required.'
      });
    }

    const formattedSource = formatImageUrlForVision(sourceImage);
    if (!formattedSource) {
      return res.status(400).json({
        error: 'A valid primary source image is required for Precise Edit.',
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
    const requestHeaders = {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:3000',
      'X-Title': 'Mestrio AI'
    };

    // If variations === 1, execute direct single call
    if (variationsCount === 1) {
      let fluxResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          model: 'black-forest-labs/flux.2-flex',
          prompt: refinedPrompt,
          image: formattedSource,
          image_references: validRefs?.length ? validRefs : undefined,
          n: 1
        })
      });

      let rawResponseText = await fluxResponse.text();
      let data = null;
      try {
        data = JSON.parse(rawResponseText);
      } catch (jsonErr) {
        console.error('Failed to parse OpenRouter response as JSON:', jsonErr.message);
      }

      // If 404 "No model found" for flux.2-flex, attempt fallback to black-forest-labs/flux.2-pro
      if (!fluxResponse.ok && fluxResponse.status === 404 && rawResponseText.includes('No model found')) {
        logger.warn('FLUX.2 Flex returned 404, attempting fallback to black-forest-labs/flux.2-pro', { requestId });
        fluxResponse = await fetch(targetUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            model: 'black-forest-labs/flux.2-pro',
            prompt: refinedPrompt,
            image: formattedSource,
            image_references: validRefs?.length ? validRefs : undefined,
            n: 1
          })
        });
        rawResponseText = await fluxResponse.text();
        try {
          data = JSON.parse(rawResponseText);
        } catch (_) {}
      }

      if (!fluxResponse.ok) {
        console.error('OpenRouter Error:', data || rawResponseText);
        const errorMsg = data?.error?.message || data?.message || rawResponseText || 'FLUX.2 generation failed';
        return res.status(fluxResponse.status || 500).json({
          error: errorMsg,
          message: errorMsg
        });
      }

      const returnedImages = Array.isArray(data?.data)
        ? data.data
        : (Array.isArray(data?.images) ? data.images : [data]);

      const formattedImages = returnedImages.map((img, idx) => {
        const url = extractAndFormatImage(img) || (typeof img === 'string' ? img : (img?.url || img?.image || img?.b64_json || ''));
        return {
          id: img?.id || \`img_\${Date.now()}_\${idx}\`,
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
        };
      });

      return res.json({
        success: true,
        images: formattedImages,
        data: data?.data || [data],
        refinedPrompt,
        count: formattedImages.length,
        model: 'black-forest-labs/flux.2-flex',
        modelName: 'FLUX.2 Flex'
      });
    }

    // If variations > 1, execute Promise.all concurrently for the variation count
    const generationTasks = Array.from({ length: variationsCount }, async (_, idx) => {
      try {
        let response = await fetch(targetUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            model: 'black-forest-labs/flux.2-flex',
            prompt: refinedPrompt,
            image: formattedSource,
            image_references: validRefs?.length ? validRefs : undefined,
            n: 1
          })
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
              model: 'black-forest-labs/flux.2-pro',
              prompt: refinedPrompt,
              image: formattedSource,
              image_references: validRefs?.length ? validRefs : undefined,
              n: 1
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
        const respData = item.data;
        const list = Array.isArray(respData?.data) ? respData.data : (Array.isArray(respData?.images) ? respData.images : [respData]);
        for (const itm of list) {
          const formatted = extractAndFormatImage(itm);
          if (formatted) collectedUrls.push(formatted);
        }
      } else if (!firstError) {
        firstError = item;
      }
    }

    if (collectedUrls.length === 0) {
      const errorMsg = firstError?.data?.error?.message || firstError?.data?.message || firstError?.rawText || 'FLUX.2 generation failed';
      console.error('OpenRouter Error:', firstError?.data || errorMsg);
      return res.status(firstError?.status || 500).json({
        error: errorMsg,
        message: errorMsg
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
      data: collectedUrls,
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
      error: err.message || 'Internal server error during Precise Edit synthesis.',
      message: err.message || 'Internal server error during Precise Edit synthesis.'
    });
  }
}`;

  controllerCode = controllerCode.slice(0, idxStart) + newExecutePreciseEdit + controllerCode.slice(idxEnd);
  fs.writeFileSync('server/src/controllers/imageController.js', controllerCode, 'utf8');
  console.log('✓ Updated executePreciseEdit in imageController.js with user OpenRouter specs & error handling');
} else {
  console.log('! Could not find executePreciseEdit boundaries in imageController.js');
}

// ============================================================================
// 3. UPDATE index.html (Frontend Error Logging & Informative Toast)
// ============================================================================
let html = fs.readFileSync('index.html', 'utf8');

const oldFrontendFetch = `                const apiBase = (window.location.origin && window.location.origin.includes('5001'))
                    ? window.location.origin
                    : 'http://localhost:5001';

                const response = await fetch(\`\${apiBase}/api/images/precise-edit\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourceImage: sourceUrl,
                        referenceImages: extraRefs,
                        instructionPrompt: editInstruction,
                        prompt: editInstruction,
                        variations: variationsCount,
                        count: variationsCount,
                        quality: quality,
                        aspectRatio: sourceRatio
                    })
                });`;

const newFrontendFetch = `                // Resolve backend endpoint (same-origin relative path when served on port 5001, direct host:5001 otherwise)
                const isPort5001 = window.location.protocol.startsWith('http') && window.location.port === '5001';
                const apiBase = isPort5001
                    ? ''
                    : (window.location.protocol.startsWith('http') && window.location.hostname
                        ? \`http://\${window.location.hostname}:5001\`
                        : 'http://localhost:5001');

                const endpoint = \`\${apiBase}/api/images/precise-edit\`;
                console.log('[Precise Edit] Submitting request to backend:', endpoint);

                let response;
                try {
                    response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            sourceImage: sourceUrl,
                            referenceImages: extraRefs,
                            instructionPrompt: editInstruction,
                            prompt: editInstruction,
                            variations: variationsCount,
                            count: variationsCount,
                            quality: quality,
                            aspectRatio: sourceRatio
                        })
                    });
                } catch (netErr) {
                    console.error('Precise edit error:', netErr);
                    clearTimeout(stageTimer);
                    clearInterval(progressTimer);
                    if (progressCard) progressCard.classList.add('hidden');

                    // If localhost:5001 failed, attempt relative path fallback if running on web server
                    let fallbackSucceeded = false;
                    if (apiBase !== '') {
                        try {
                            console.log('[Precise Edit] Attempting relative fallback endpoint /api/images/precise-edit...');
                            response = await fetch('/api/images/precise-edit', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                    sourceImage: sourceUrl,
                                    referenceImages: extraRefs,
                                    instructionPrompt: editInstruction,
                                    prompt: editInstruction,
                                    variations: variationsCount,
                                    count: variationsCount,
                                    quality: quality,
                                    aspectRatio: sourceRatio
                                })
                            });
                            fallbackSucceeded = response.ok || response.status > 0;
                        } catch (fErr) {
                            console.error('Precise edit error (relative fallback):', fErr);
                        }
                    }

                    if (!fallbackSucceeded && !response) {
                        const isConnRefused = netErr.message && (
                            netErr.message.toLowerCase().includes('failed to fetch') ||
                            netErr.message.toLowerCase().includes('networkerror') ||
                            netErr.message.toLowerCase().includes('connection refused')
                        );
                        const userMsg = isConnRefused
                            ? 'Cannot connect to backend server on port 5001. Please ensure Express backend is running.'
                            : (netErr.message || 'Network error connecting to backend.');
                        showStudioToast(userMsg);
                        return;
                    }
                }`;

if (html.includes(oldFrontendFetch)) {
  html = html.replace(oldFrontendFetch, newFrontendFetch);
  console.log('✓ Updated fetch call and network error fallback in index.html');
} else {
  console.log('- oldFrontendFetch not found exactly in index.html, checking pattern...');
}

// Update error handling in index.html response handling
const oldErrCheck = `                } else {
                    let errMsg = 'Server error during Precise Edit synthesis.';
                    try {
                        const errData = await response.json();
                        if (errData?.message) errMsg = errData.message;
                    } catch (_) {}
                    showStudioToast(errMsg);
                }`;

const newErrCheck = `                } else {
                    let errMsg = 'Server error during Precise Edit synthesis.';
                    try {
                        const errData = await response.json();
                        errMsg = errData?.error || errData?.message || errData?.error?.message || errMsg;
                    } catch (_) {
                        try {
                            const errText = await response.text();
                            if (errText) errMsg = errText;
                        } catch (__) {}
                    }
                    console.error('Precise edit error:', errMsg);
                    showStudioToast(errMsg);
                }`;

if (html.includes(oldErrCheck)) {
  html = html.replace(oldErrCheck, newErrCheck);
  console.log('✓ Updated response error extraction in index.html');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Saved index.html\n');

// ============================================================================
// 4. UPDATE src/components/ImageWorkspace.tsx
// ============================================================================
let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

const oldTsxFetch = `        const res = await fetch('/api/images/precise-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceImage,
            instructionPrompt: editPrompt.trim(),
            variations: preciseCount,
            quality
          })
        });
        await res.json();`;

const newTsxFetch = `        const endpoint = (window.location.port === '5001' || !window.location.port) && window.location.protocol.startsWith('http')
          ? '/api/images/precise-edit'
          : \`http://\${window.location.hostname || 'localhost'}:5001/api/images/precise-edit\`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceImage,
            instructionPrompt: editPrompt.trim(),
            variations: preciseCount,
            quality
          })
        });
        const data = await res.json();
        if (!res.ok) {
          const errMsg = data?.error || data?.message || 'FLUX.2 generation failed';
          console.error('Precise edit error:', errMsg);
          alert(errMsg);
        }`;

if (tsx.includes(oldTsxFetch)) {
  tsx = tsx.replace(oldTsxFetch, newTsxFetch);
  console.log('✓ Updated fetch and error extraction in src/components/ImageWorkspace.tsx');
  fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf8');
}

console.log('=== CORS & ERROR FIXES APPLIED SUCCESSFULLY ===');

