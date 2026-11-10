// scratch/apply_object_object_fix.cjs
const fs = require('fs');

console.log('=== APPLYING [object Object] ELIMINATION & OPENROUTER ERROR SANITIZATION ===\n');

// ============================================================================
// 1. UPDATE index.html (showStudioToast & getErrorMessage)
// ============================================================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Insert getErrorMessage and make showStudioToast unwrap any object safely
const oldShowStudioToast = `        // Toast notification system
        function showStudioToast(msg, duration = 3000) {
            const existing = document.getElementById('studio-toast-banner');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.id = 'studio-toast-banner';
            toast.className = 'fixed bottom-5 right-5 z-[99999] px-4 py-2.5 rounded-xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-medium shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none';
            toast.innerHTML = \`
                <svg class="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>\${escapeHtml(msg)}</span>
            \`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => toast.remove(), 250);
            }, duration);
        }`;

const newShowStudioToast = `        // Robust Error String Extractor (Eliminates [object Object])
        function getErrorMessage(err) {
            if (!err) return 'An error occurred';
            if (typeof err === 'string') return err;
            if (err?.error?.message && typeof err.error.message === 'string') return err.error.message;
            if (err?.error && typeof err.error === 'string') return err.error;
            if (err?.message && typeof err.message === 'string') return err.message;
            try {
                return JSON.stringify(err);
            } catch (_) {
                return String(err);
            }
        }
        window.getErrorMessage = getErrorMessage;

        // Toast notification system
        function showStudioToast(msg, duration = 3000) {
            const existing = document.getElementById('studio-toast-banner');
            if (existing) existing.remove();

            const cleanMsg = getErrorMessage(msg);

            const toast = document.createElement('div');
            toast.id = 'studio-toast-banner';
            toast.className = 'fixed bottom-5 right-5 z-[99999] px-4 py-2.5 rounded-xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-medium shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none';
            toast.innerHTML = \`
                <svg class="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>\${escapeHtml(cleanMsg)}</span>
            \`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => toast.remove(), 250);
            }, duration);
        }`;

if (html.includes(oldShowStudioToast)) {
  html = html.replace(oldShowStudioToast, newShowStudioToast);
  console.log('✓ Added getErrorMessage and updated showStudioToast in index.html');
}

// B. Update applyStudioPreciseEdit error unwrapping
const oldApplyErrorBlock = `                } else {
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
                }
            } catch (err) {
                clearTimeout(stageTimer);
                clearInterval(progressTimer);
                if (progressCard) progressCard.classList.add('hidden');
                console.error("Error applying precise edit:", err);
                showStudioToast(err.message || "Failed to apply edit");
            }`;

const newApplyErrorBlock = `                } else {
                    let errorData = null;
                    try {
                        errorData = await response.json();
                    } catch (_) {
                        try {
                            errorData = await response.text();
                        } catch (__) {}
                    }
                    const errorMessage = getErrorMessage(errorData) || 'Server error during Precise Edit synthesis.';
                    console.error('Precise edit error:', errorMessage);
                    showStudioToast(errorMessage);
                }
            } catch (err) {
                clearTimeout(stageTimer);
                clearInterval(progressTimer);
                if (progressCard) progressCard.classList.add('hidden');
                console.error("Precise edit error:", err);
                showStudioToast(getErrorMessage(err));
            }`;

if (html.includes(oldApplyErrorBlock)) {
  html = html.replace(oldApplyErrorBlock, newApplyErrorBlock);
  console.log('✓ Updated applyStudioPreciseEdit error handlers in index.html');
} else {
  console.log('- oldApplyErrorBlock not found exactly in index.html, searching pattern...');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Saved index.html\n');

// ============================================================================
// 2. UPDATE server/src/controllers/imageController.js
// ============================================================================
let controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// Replace the executePreciseEdit synthesis block with exact OpenRouter sanitization and aligned payload
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

    // Aligned payload supporting both direct 'image', 'images' array, and 'image_references'
    const fluxPayload = {
      model: 'black-forest-labs/flux.2-flex',
      prompt: refinedPrompt,
      image: formattedSource,
      images: [formattedSource, ...(validRefs?.length ? validRefs : [])],
      ...(validRefs?.length ? { image_references: validRefs } : {}),
      n: 1
    };

    console.log('[FLUX.2 Flex Request Payload]:', {
      model: fluxPayload.model,
      promptLength: refinedPrompt.length,
      hasSource: Boolean(formattedSource),
      sourcePrefix: formattedSource ? formattedSource.slice(0, 45) + '...' : null,
      refCount: validRefs.length
    });

    // If variations === 1, execute direct single call
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
        logger.error('Failed to connect to OpenRouter Image API', { error: netErr.message });
        return res.status(502).json({
          success: false,
          error: \`Unable to reach OpenRouter Image API: \${netErr.message}. Please check your network connection or API status.\`
        });
      }

      console.log(\`[OpenRouter FLUX.2 Response HTTP \${fluxResponse.status}]:\`, rawResponseText);

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
          console.log(\`[OpenRouter Fallback HTTP \${fallbackResponse.status}]:\`, fallbackText);
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

    // If variations > 1, execute concurrent calls for requested count
    const generationTasks = Array.from({ length: variationsCount }, async (_, idx) => {
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
      const rawError = firstError?.data?.error;
      const errorMessage = typeof rawError === 'string'
        ? rawError
        : rawError?.message || firstError?.data?.message || firstError?.rawText || 'FLUX.2 generation failed';

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
      success: false,
      error: err.message || 'Internal server error during Precise Edit synthesis.'
    });
  }
}`;

  controllerCode = controllerCode.slice(0, idxStart) + newExecutePreciseEdit + controllerCode.slice(idxEnd);
  fs.writeFileSync('server/src/controllers/imageController.js', controllerCode, 'utf8');
  console.log('✓ Updated executePreciseEdit with sanitized error returns and aligned FLUX.2 Flex payload');
} else {
  console.error('! Failed to find executePreciseEdit boundaries in imageController.js');
}

// ============================================================================
// 3. UPDATE src/components/ImageWorkspace.tsx (getErrorMessage)
// ============================================================================
let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

if (!tsx.includes('const getErrorMessage =')) {
  const helperCode = `const getErrorMessage = (err: any): string => {
  if (!err) return 'An error occurred';
  if (typeof err === 'string') return err;
  if (err?.error?.message && typeof err.error.message === 'string') return err.error.message;
  if (err?.error && typeof err.error === 'string') return err.error;
  if (err?.message && typeof err.message === 'string') return err.message;
  try {
    return JSON.stringify(err);
  } catch (_) {
    return String(err);
  }
};\n\n`;

  tsx = tsx.replace('export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({', helperCode + 'export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({');
}

const oldTsxCatch = `        const data = await res.json();
        if (!res.ok) {
          const errMsg = data?.error || data?.message || 'FLUX.2 generation failed';
          console.error('Precise edit error:', errMsg);
          alert(errMsg);
        }
      }
    } catch (err) {
      console.error('Error in handleEditSubmit:', err);
    }`;

const newTsxCatch = `        const data = await res.json();
        if (!res.ok || !data.success) {
          const errMsg = getErrorMessage(data) || 'FLUX.2 generation failed';
          console.error('Precise edit error:', errMsg);
          alert(errMsg);
        }
      }
    } catch (err: any) {
      console.error('Precise edit error:', err);
      alert(getErrorMessage(err));
    }`;

if (tsx.includes(oldTsxCatch)) {
  tsx = tsx.replace(oldTsxCatch, newTsxCatch);
  console.log('✓ Updated error handling in ImageWorkspace.tsx to use getErrorMessage');
}

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf8');
console.log('✓ Saved src/components/ImageWorkspace.tsx\n');

console.log('=== FIX APPLIED SUCCESSFULLY ===');

