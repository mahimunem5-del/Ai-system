// scratch/apply_precise_edit_frontend.cjs
const fs = require('fs');

console.log('=== APPLYING PRECISE EDIT FRONTEND TRIGGER & VARIATIONS (HTML & TSX) ===\n');

// ============================================================================
// 1. UPDATE index.html
// ============================================================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Update Quality dropdown options to Speed, Medium, High
const oldQualityOptions = `<button type="button" data-weight="low" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">
                                            <span>Low</span>
                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>
                                        <button type="button" data-weight="medium" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-xs font-medium cursor-pointer transition-colors text-left group">
                                            <span class="font-semibold text-slate-800 dark:text-slate-100">Medium</span>
                                            <svg class="studio-precise-weight-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>
                                        <button type="button" data-weight="high" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">
                                            <span>High</span>
                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>`;

const newQualityOptions = `<button type="button" data-weight="speed" data-label="Speed" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">
                                            <span>Speed</span>
                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>
                                        <button type="button" data-weight="medium" data-label="Medium" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-xs font-medium cursor-pointer transition-colors text-left group">
                                            <span class="font-semibold text-slate-800 dark:text-slate-100">Medium</span>
                                            <svg class="studio-precise-weight-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>
                                        <button type="button" data-weight="high" data-label="High" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">
                                            <span>High</span>
                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        </button>`;

if (html.includes(oldQualityOptions)) {
  html = html.replace(oldQualityOptions, newQualityOptions);
  console.log('✓ Replaced Quality dropdown options in index.html with Speed, Medium, High');
} else {
  console.log('- Quality dropdown options already updated or pattern differed');
}

// B. Update IMAGE_MODELS and OPENROUTER_IMAGE_MODEL_MAP in index.html to include flux.2-flex
if (!html.includes('black-forest-labs/flux.2-flex')) {
  html = html.replace(
    `            {
                id: "black-forest-labs/flux.2-pro",
                name: "FLUX.2 Pro",
                provider: "bfl"
            },`,
    `            {
                id: "black-forest-labs/flux.2-flex",
                name: "FLUX.2 Flex",
                provider: "bfl"
            },
            {
                id: "black-forest-labs/flux.2-pro",
                name: "FLUX.2 Pro",
                provider: "bfl"
            },`
  );
  html = html.replace(
    `            'black-forest-labs/flux.2-pro': 'black-forest-labs/flux.2-pro',`,
    `            'black-forest-labs/flux.2-flex': 'black-forest-labs/flux.2-flex',
            'black-forest-labs/flux.2-pro': 'black-forest-labs/flux.2-pro',`
  );
  console.log('✓ Added black-forest-labs/flux.2-flex to index.html IMAGE_MODELS');
}

// C. Update QUALITY_DISPLAY_LABELS in index.html
if (html.includes("const QUALITY_DISPLAY_LABELS = {")) {
  html = html.replace(
    `            const QUALITY_DISPLAY_LABELS = {
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High'
            };`,
    `            const QUALITY_DISPLAY_LABELS = {
                'speed': 'Speed',
                'low': 'Speed',
                'medium': 'Medium',
                'high': 'High'
            };`
  );
  console.log('✓ Updated QUALITY_DISPLAY_LABELS in index.html');
}

// D. Replace applyStudioPreciseEdit with Two-Stage Pipeline trigger
const oldApplyStudioPreciseEditStart = 'async function applyStudioPreciseEdit() {';
const oldApplyStudioPreciseEditEnd = 'function applyStudioImageEdit() {';

const idxStart = html.indexOf(oldApplyStudioPreciseEditStart);
const idxEnd = html.indexOf(oldApplyStudioPreciseEditEnd);

if (idxStart !== -1 && idxEnd !== -1) {
  const newApplyStudioPreciseEdit = `async function applyStudioPreciseEdit() {
            if (!studioPreciseEditState.sourceItem) {
                showStudioToast("No source image selected to edit");
                return;
            }

            const editInput = document.getElementById("studio-precise-edit-input");
            const editInstruction = editInput ? editInput.value.trim() : "";
            const errorEl = document.getElementById("studio-precise-edit-error");

            if (!editInstruction) {
                if (errorEl) {
                    errorEl.classList.remove("hidden");
                    errorEl.classList.add("flex");
                }
                if (editInput) editInput.focus();
                showStudioToast("Please describe the change you want to make.");
                return;
            }

            if (errorEl) {
                errorEl.classList.add("hidden");
                errorEl.classList.remove("flex");
            }

            const sourceItem = studioPreciseEditState.sourceItem;
            const sourceUrl = sourceItem.url || sourceItem.img;
            const quality = (studioPreciseEditState.quality || studioPreciseEditState.editWeight || "Medium");
            const variationsCount = studioPreciseEditState.variationCount || 1;
            const sourceRatio = sourceItem.aspectRatio || sourceItem.ratio || "1:1";

            // Package reference images (up to 10 optional style/asset guides)
            const extraRefs = (studioPreciseEditState.referenceImages || [])
                .map(r => (typeof r === 'string' ? r : (r?.dataUrl || r?.url || r?.image || '')))
                .filter(Boolean)
                .slice(0, 10);

            // Two-Stage Trigger & Loading States: "Mahi Engine refining..." -> "Generating with FLUX.2..."
            const applyBtn = document.getElementById("studio-apply-precise-edit-btn");
            const applyIcon = document.getElementById("studio-apply-precise-edit-icon");
            const applySpinner = document.getElementById("studio-apply-precise-edit-spinner");
            const applyText = document.getElementById("studio-apply-precise-edit-text");

            if (applyBtn) {
                applyBtn.disabled = true;
                applyBtn.classList.remove("cursor-pointer", "active:scale-98");
                applyBtn.classList.add("cursor-not-allowed");
            }
            if (applyIcon) applyIcon.classList.add("hidden");
            if (applySpinner) applySpinner.classList.remove("hidden");
            if (applyText) applyText.textContent = "Mahi Engine refining...";

            // Canvas In-Progress Card Feedback
            const progressCard = document.getElementById('ideogram-in-progress-card');
            const progressStatus = document.getElementById('ideogram-progress-status-text');
            const progressPrompt = document.getElementById('ideogram-progress-prompt-text');
            const progressModel = document.getElementById('ideogram-progress-model-badge');
            const progressRatio = document.getElementById('ideogram-progress-ratio-badge');
            const progressCount = document.getElementById('ideogram-progress-count-badge');
            const progressBar = document.getElementById('ideogram-progress-bar-fill');
            const skeletonGrid = document.getElementById('ideogram-progress-skeletons');

            if (progressCard) {
                progressCard.classList.remove('hidden');
                if (progressPrompt) progressPrompt.textContent = editInstruction;
                if (progressStatus) progressStatus.textContent = 'Mahi Engine refining...';
                if (progressModel) progressModel.textContent = 'FLUX.2 Flex';
                if (progressRatio) progressRatio.textContent = sourceRatio;
                if (progressCount) progressCount.textContent = \`\${variationsCount} variation\${variationsCount > 1 ? 's' : ''}\`;
                if (progressBar) progressBar.style.width = '30%';

                if (skeletonGrid) {
                    skeletonGrid.innerHTML = '';
                    let aspectClass = 'aspect-square';
                    if (sourceRatio === '16:9') aspectClass = 'aspect-video';
                    else if (sourceRatio === '9:16') aspectClass = 'aspect-[9/16]';
                    else if (sourceRatio === '4:3') aspectClass = 'aspect-[4/3]';
                    else if (sourceRatio === '3:4') aspectClass = 'aspect-[3/4]';
                    else if (sourceRatio === '2:3') aspectClass = 'aspect-[2/3]';
                    else if (sourceRatio === '3:2') aspectClass = 'aspect-[3/2]';

                    if (variationsCount === 1) {
                        skeletonGrid.className = 'variations-grid w-full max-w-[420px]';
                    } else if (variationsCount === 2) {
                        skeletonGrid.className = 'variations-grid grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-[720px] w-full';
                    } else {
                        skeletonGrid.className = 'variations-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full';
                    }

                    for (let i = 0; i < variationsCount; i++) {
                        const skel = document.createElement('div');
                        skel.className = \`\${aspectClass} max-h-[520px] rounded-xl overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 animate-pulse border border-slate-200/50 dark:border-white/5 shadow-inner flex flex-col items-center justify-center relative w-full\`;
                        skel.innerHTML = \`
                            <div class="flex flex-col items-center justify-center gap-2.5 p-4 select-none">
                                <div class="w-11 h-11 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/60 dark:border-white/10 text-blue-500 dark:text-blue-400">
                                    <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
                                    </svg>
                                </div>
                                <span class="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">FLUX.2 Flex Synthesizing...</span>
                            </div>
                        \`;
                        skeletonGrid.appendChild(skel);
                    }
                }

                const viewport = document.getElementById('ideogram-assets-viewport');
                if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Smooth Stage 1 -> Stage 2 text transition after 1.8 seconds
            const stageTimer = setTimeout(() => {
                if (applyText && applyBtn && applyBtn.disabled) {
                    applyText.textContent = "Generating with FLUX.2...";
                }
                if (progressStatus) progressStatus.textContent = "Generating with FLUX.2...";
                if (progressBar) progressBar.style.width = "65%";
            }, 1800);

            const progressTimer = setInterval(() => {
                if (progressBar) {
                    const curW = parseInt(progressBar.style.width, 10) || 30;
                    if (curW < 90) progressBar.style.width = \`\${curW + 10}%\`;
                }
            }, 700);

            try {
                const apiBase = (window.location.origin && window.location.origin.includes('5001'))
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
                });

                clearTimeout(stageTimer);
                clearInterval(progressTimer);
                if (progressCard) progressCard.classList.add('hidden');

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.success && Array.isArray(data.images) && data.images.length > 0) {
                        const groupId = 'pe_' + Date.now();
                        const nowIso = new Date().toISOString();
                        const newGenerated = data.images.map((img, idx) => ({
                            id: img.id || ('img_' + Date.now() + '_' + idx),
                            groupId: groupId,
                            title: editInstruction.length > 50 ? editInstruction.slice(0, 50) + '...' : editInstruction,
                            prompt: img.prompt || data.refinedPrompt || editInstruction,
                            enhancedPrompt: img.prompt || data.refinedPrompt || editInstruction,
                            originalPrompt: editInstruction,
                            editInstruction: editInstruction,
                            isPreciseEdit: true,
                            isSmartEdit: true,
                            sourceImage: sourceUrl,
                            img: img.url,
                            url: img.url,
                            model: 'black-forest-labs/flux.2-flex',
                            modelName: 'FLUX.2 Flex',
                            aspectRatio: sourceRatio,
                            time: 'Just now',
                            createdAt: nowIso
                        }));

                        STUDIO_RECENT_IMAGES.unshift(...newGenerated);
                        saveStoredRecentImages(STUDIO_RECENT_IMAGES);
                        renderStudioFeed();
                        showStudioToast(\`Precise edit created \${newGenerated.length} variation(s) with FLUX.2 Flex!\`);
                    } else {
                        const errMsg = data?.message || 'Precise edit failed to produce results.';
                        showStudioToast(errMsg);
                    }
                } else {
                    let errMsg = 'Server error during Precise Edit synthesis.';
                    try {
                        const errData = await response.json();
                        if (errData?.message) errMsg = errData.message;
                    } catch (_) {}
                    showStudioToast(errMsg);
                }
            } catch (err) {
                clearTimeout(stageTimer);
                clearInterval(progressTimer);
                if (progressCard) progressCard.classList.add('hidden');
                console.error("Error applying precise edit:", err);
                showStudioToast(err.message || "Failed to apply edit");
            } finally {
                clearTimeout(stageTimer);
                clearInterval(progressTimer);
                if (applyIcon) applyIcon.classList.remove("hidden");
                if (applySpinner) applySpinner.classList.add("hidden");
                if (applyText) applyText.textContent = "Apply edit";
                updatePreciseEditButtonState();
            }
        }

        `;

  html = html.slice(0, idxStart) + newApplyStudioPreciseEdit + html.slice(idxEnd);
  console.log('✓ Replaced applyStudioPreciseEdit with Two-Stage Pipeline trigger in index.html');
}

// E. Update groupStudioAssets in index.html to store isPreciseEdit
const oldGroupAssetsMap = `                        time: img.time || 'Just now',
                        isSmartEdit: Boolean(img.isSmartEdit || img.sourceImage),`;

const newGroupAssetsMap = `                        time: img.time || 'Just now',
                        isPreciseEdit: Boolean(img.isPreciseEdit),
                        isSmartEdit: Boolean(img.isPreciseEdit || img.isSmartEdit || img.sourceImage),`;

if (html.includes(oldGroupAssetsMap)) {
  html = html.replace(oldGroupAssetsMap, newGroupAssetsMap);
  console.log('✓ Updated groupStudioAssets to record isPreciseEdit');
}

if (html.includes('if (img.isSmartEdit || img.sourceImage) {')) {
  html = html.replace(
    `                if (img.isSmartEdit || img.sourceImage) {
                    existing.isSmartEdit = true;
                    if (img.sourceImage) existing.sourceImage = img.sourceImage;
                    if (img.editInstruction) existing.editInstruction = img.editInstruction;
                }`,
    `                if (img.isPreciseEdit) {
                    existing.isPreciseEdit = true;
                    existing.isSmartEdit = true;
                    existing.modelName = 'FLUX.2 Flex';
                }
                if (img.isSmartEdit || img.sourceImage) {
                    existing.isSmartEdit = true;
                    if (img.sourceImage) existing.sourceImage = img.sourceImage;
                    if (img.editInstruction) existing.editInstruction = img.editInstruction;
                }`
  );
  console.log('✓ Updated existing group check in groupStudioAssets');
}

// F. Update renderStudioFeed header tag in index.html
if (html.includes("Smart Edit\n                            </span>")) {
  html = html.replace(
    `                const isSmartEdit = Boolean(group.isSmartEdit || group.sourceImage || (group.images && group.images.some(img => img.isSmartEdit || img.sourceImage)));`,
    `                const isPreciseEdit = Boolean(group.isPreciseEdit || (group.images && group.images.some(img => img.isPreciseEdit)));
                const isSmartEdit = Boolean(isPreciseEdit || group.isSmartEdit || group.sourceImage || (group.images && group.images.some(img => img.isSmartEdit || img.sourceImage)));`
  );

  html = html.replace(
    `<span class="font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Smart Edit
                            </span>
                            <span>•</span>
                            <span class="flex items-center gap-1">
                                <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>\${formattedTime}</span>
                            </span>
                            <span>•</span>
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-sans font-medium">
                                \${escapeHtml(modelObj.name)}
                            </span>`,
    `<span class="font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span class="inline-block w-1.5 h-1.5 rounded-full \${isPreciseEdit ? 'bg-indigo-500' : 'bg-blue-500'}"></span>
                                \${isPreciseEdit ? 'Precise Edit' : 'Smart Edit'}
                            </span>
                            <span>•</span>
                            <span class="flex items-center gap-1">
                                <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>\${formattedTime}</span>
                            </span>
                            <span>•</span>
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-sans font-medium">
                                \${escapeHtml(isPreciseEdit ? (group.modelName || 'FLUX.2 Flex') : modelObj.name)}
                            </span>`
  );
  console.log('✓ Updated headerContentHtml to display Precise Edit • Just now • FLUX.2 Flex');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Saved index.html updates\n');

// ============================================================================
// 2. UPDATE src/components/ImageWorkspace.tsx
// ============================================================================
let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

// A. Update quality state and add precise loading step
if (!tsx.includes('preciseLoadingStep')) {
  tsx = tsx.replace(
    "const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');",
    "const [quality, setQuality] = useState<'speed' | 'medium' | 'high'>('medium');\n  const [preciseLoadingStep, setPreciseLoadingStep] = useState<'idle' | 'refining' | 'generating'>('idle');"
  );
  console.log('✓ Added preciseLoadingStep state to ImageWorkspace.tsx');
}

// B. Update Quality dropdown in ImageWorkspace.tsx
if (tsx.includes("{(['low', 'medium', 'high'] as const).map((q) => (")) {
  tsx = tsx.replace(
    `                      <span id="studio-precise-edit-weight-label" className="font-medium truncate capitalize">{quality}</span>`,
    `                      <span id="studio-precise-edit-weight-label" className="font-medium truncate capitalize">{quality === 'speed' ? 'Speed' : quality === 'medium' ? 'Medium' : 'High'}</span>`
  );
  tsx = tsx.replace(
    `{(['low', 'medium', 'high'] as const).map((q) => (`,
    `{(['speed', 'medium', 'high'] as const).map((q) => (`
  );
  tsx = tsx.replace(
    `<span className="capitalize">{q}</span>`,
    `<span className="capitalize">{q === 'speed' ? 'Speed' : q === 'medium' ? 'Medium' : 'High'}</span>`
  );
  console.log('✓ Updated Quality dropdown in ImageWorkspace.tsx');
}

// C. Update handleEditSubmit and Apply Edit Button in ImageWorkspace.tsx
const oldHandleEdit = `  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage || !editPrompt.trim()) return;
    onApplyEdit?.({
      sourceImage,
      prompt: editPrompt.trim(),
      count: variationsCount,
      quality
    });
  };`;

const newHandleEdit = `  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage || !editPrompt.trim() || preciseLoadingStep !== 'idle') return;

    setPreciseLoadingStep('refining');
    const stageTimer = setTimeout(() => {
      setPreciseLoadingStep('generating');
    }, 1800);

    try {
      if (onApplyEdit) {
        await onApplyEdit({
          sourceImage,
          prompt: editPrompt.trim(),
          count: preciseCount,
          quality
        });
      } else {
        const res = await fetch('/api/images/precise-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceImage,
            instructionPrompt: editPrompt.trim(),
            variations: preciseCount,
            quality
          })
        });
        await res.json();
      }
    } catch (err) {
      console.error('Error in handleEditSubmit:', err);
    } finally {
      clearTimeout(stageTimer);
      setPreciseLoadingStep('idle');
    }
  };`;

if (tsx.includes(oldHandleEdit)) {
  tsx = tsx.replace(oldHandleEdit, newHandleEdit);
  console.log('✓ Updated handleEditSubmit in ImageWorkspace.tsx');
}

const oldApplyBtnTsx = `                <button
                  id="studio-apply-precise-edit-btn"
                  type="submit"
                  disabled={!sourceImage}
                  className={\`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 \${
                    sourceImage
                      ? 'cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  }\`}
                >
                  <span id="studio-apply-precise-edit-text">Apply edit</span>
                </button>`;

const newApplyBtnTsx = `                <button
                  id="studio-apply-precise-edit-btn"
                  type="submit"
                  disabled={!sourceImage || preciseLoadingStep !== 'idle'}
                  className={\`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 \${
                    sourceImage && preciseLoadingStep === 'idle'
                      ? 'cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  }\`}
                >
                  {preciseLoadingStep !== 'idle' && (
                    <span id="studio-apply-precise-edit-spinner">
                      <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  <span id="studio-apply-precise-edit-text">
                    {preciseLoadingStep === 'refining'
                      ? 'Mahi Engine refining...'
                      : preciseLoadingStep === 'generating'
                      ? 'Generating with FLUX.2...'
                      : 'Apply edit'}
                  </span>
                </button>`;

if (tsx.includes(oldApplyBtnTsx)) {
  tsx = tsx.replace(oldApplyBtnTsx, newApplyBtnTsx);
  console.log('✓ Updated apply button in ImageWorkspace.tsx with loading states');
}

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf8');
console.log('✓ Saved src/components/ImageWorkspace.tsx updates\n');

console.log('=== FRONTEND UPDATES APPLIED SUCCESSFULLY ===');

