// scratch/apply_authentic_bg_removal.cjs
const fs = require('fs');

console.log('=== APPLYING AUTHENTIC CLIENT-SIDE AI BG REMOVAL (@imgly 1.5.6) ===\n');

// 1. UPDATE index.html
let html = fs.readFileSync('index.html', 'utf8');

// Add .transparent-checkerboard-bg CSS in <style>
const styleAnchor = '/* Global Application Shell - Seamless Unified Canvas & Conditional Sidebar Border */';
const checkerboardCss = `/* Ideogram-Grade Seamless Transparency Checkerboard Grid */
        .transparent-checkerboard-bg {
            background-color: #ffffff;
            background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                              linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                              linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
        html.dark .transparent-checkerboard-bg {
            background-color: #141414;
            background-image: linear-gradient(45deg, #242424 25%, transparent 25%),
                              linear-gradient(-45deg, #242424 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #242424 75%),
                              linear-gradient(-45deg, transparent 75%, #242424 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }

        /* Global Application Shell - Seamless Unified Canvas & Conditional Sidebar Border */`;

if (!html.includes('.transparent-checkerboard-bg') && html.includes(styleAnchor)) {
  html = html.replace(styleAnchor, checkerboardCss);
  console.log('✓ Added .transparent-checkerboard-bg CSS in index.html');
}

// Replace the entire remove-bg JS pipeline in index.html
const oldPipelineRegex = /\/\/ 4\. Remove Background Pipeline[\s\S]*?\/\/ 5\. Upscale Image Pipeline/m;

const newPipelineCode = `// 4. Remove Background Pipeline (Ideogram Minimalist & High-Accuracy Boundary Cutout)
            const removeBgUploadZone = document.getElementById('remove-bg-upload-zone');
            const removeBgAddBtn = document.getElementById('remove-bg-add-btn');
            const removeBgFileInput = document.getElementById('remove-bg-file-input');
            const removeBgPreviewWrapper = document.getElementById('remove-bg-preview-wrapper');
            const removeBgPreviewImg = document.getElementById('remove-bg-preview-img');
            const removeBgRemoveBtn = document.getElementById('remove-bg-remove-file-btn');
            const btnDoRemoveBg = document.getElementById('btn-do-remove-bg');
            const btnDoRemoveBgText = document.getElementById('btn-do-remove-bg-text');

            let removeBgSourceFile = null;
            function handleRemoveBgFile(file) {
                if (!file || !file.type.startsWith('image/')) {
                    showStudioToast('Please upload a valid image file (PNG, JPG, or WebP)');
                    return;
                }
                removeBgSourceFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    removeBgSourceData = e.target.result;
                    if (removeBgPreviewImg) removeBgPreviewImg.src = removeBgSourceData;
                    if (removeBgPreviewWrapper) removeBgPreviewWrapper.classList.remove('hidden');
                    if (removeBgUploadZone) removeBgUploadZone.classList.add('hidden');
                    if (btnDoRemoveBg) {
                        btnDoRemoveBg.disabled = false;
                        btnDoRemoveBg.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100';
                    }
                };
                reader.readAsDataURL(file);
            }

            if (removeBgFileInput) {
                removeBgFileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) handleRemoveBgFile(e.target.files[0]);
                });
            }

            if (removeBgAddBtn) {
                removeBgAddBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (removeBgFileInput) removeBgFileInput.click();
                });
            }

            if (removeBgUploadZone) {
                removeBgUploadZone.addEventListener('click', () => {
                    if (removeBgFileInput) removeBgFileInput.click();
                });

                ['dragenter', 'dragover'].forEach(eventName => {
                    removeBgUploadZone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeBgUploadZone.classList.add('border-neutral-400', 'dark:border-neutral-500');
                    });
                });

                ['dragleave', 'dragend'].forEach(eventName => {
                    removeBgUploadZone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeBgUploadZone.classList.remove('border-neutral-400', 'dark:border-neutral-500');
                    });
                });

                removeBgUploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeBgUploadZone.classList.remove('border-neutral-400', 'dark:border-neutral-500');
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleRemoveBgFile(e.dataTransfer.files[0]);
                    }
                });
            }

            if (removeBgRemoveBtn) {
                removeBgRemoveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeBgSourceData = null;
                    removeBgSourceFile = null;
                    if (removeBgFileInput) removeBgFileInput.value = '';
                    if (removeBgPreviewImg) removeBgPreviewImg.src = '';
                    if (removeBgPreviewWrapper) removeBgPreviewWrapper.classList.add('hidden');
                    if (removeBgUploadZone) removeBgUploadZone.classList.remove('hidden');
                    if (btnDoRemoveBg) {
                        btnDoRemoveBg.disabled = true;
                        btnDoRemoveBg.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed';
                    }
                });
            }

            if (btnDoRemoveBg) {
                btnDoRemoveBg.addEventListener('click', async () => {
                    if (!removeBgSourceData && !removeBgSourceFile) return;
                    btnDoRemoveBg.disabled = true;
                    if (btnDoRemoveBgText) btnDoRemoveBgText.textContent = 'Removing background...';

                    try {
                        const sourceImageFileOrBlob = removeBgSourceFile || removeBgSourceData;
                        const config = {
                            publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.5.6/dist/',
                            debug: false,
                            progress: (key, current, total) => {
                                if (btnDoRemoveBgText && total > 0) {
                                    const pct = Math.min(100, Math.round((current / total) * 100));
                                    btnDoRemoveBgText.textContent = \`Removing background (\${pct}%)...\`;
                                }
                            }
                        };

                        let removeBackgroundFn = null;
                        try {
                            const imgly = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.6/+esm');
                            removeBackgroundFn = imgly.removeBackground || imgly.default;
                        } catch (importErr) {
                            console.warn('Primary jsdelivr ESM import caught, trying unpkg...', importErr);
                            const imglyFallback = await import('https://unpkg.com/@imgly/background-removal@1.5.6/+esm');
                            removeBackgroundFn = imglyFallback.removeBackground || imglyFallback.default;
                        }

                        if (typeof removeBackgroundFn !== 'function') {
                            throw new Error('removeBackground function not available from @imgly/background-removal');
                        }

                        const blob = await removeBackgroundFn(sourceImageFileOrBlob, config);
                        if (!blob || blob.size === 0) {
                            throw new Error('Segmentation returned empty result');
                        }

                        const transparentImageUrl = URL.createObjectURL(blob);

                        // Read natural dimensions
                        const tmpImg = new Image();
                        await new Promise((res) => {
                            tmpImg.onload = res;
                            tmpImg.onerror = res;
                            tmpImg.src = transparentImageUrl;
                        });
                        const outW = tmpImg.naturalWidth || 1024;
                        const outH = tmpImg.naturalHeight || 1024;

                        const item = {
                            id: 'bg-removed-' + Date.now(),
                            url: transparentImageUrl,
                            img: transparentImageUrl,
                            blob: blob,
                            title: 'Background Removed',
                            prompt: 'Background Removed (Transparent Cutout)',
                            originalPrompt: 'Background Removed (Transparent Cutout)',
                            model: 'Transparent Cutout',
                            modelName: 'Transparent Cutout',
                            isTransparent: true,
                            aspectRatio: \`\${outW}:\${outH}\`,
                            createdAt: new Date().toISOString()
                        };

                        STUDIO_RECENT_IMAGES.unshift(item);
                        if (typeof renderStudioAssetsGallery === 'function') {
                            renderStudioAssetsGallery();
                        }
                        showStudioToast('Background removed successfully!');
                    } catch (err) {
                        console.error('BG removal execution error:', err);
                        showStudioToast('Failed to remove background. Please try another image.');
                    } finally {
                        btnDoRemoveBg.disabled = false;
                        if (btnDoRemoveBgText) btnDoRemoveBgText.textContent = 'Remove background';
                    }
                });
            }

            // 5. Upscale Image Pipeline`;

if (oldPipelineRegex.test(html)) {
  html = html.replace(oldPipelineRegex, newPipelineCode);
  console.log('✓ [index.html] Replaced remove-bg pipeline with exact @imgly 1.5.6 staticimgly CDN loader');
} else {
  console.error('✗ [index.html] Could not find oldPipelineRegex in index.html');
}

// Update card background in renderStudioAssetsGallery to use transparent-checkerboard-bg
const oldCardBgClass = `const cardBg = isCutout
                        ? 'bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:8px_8px] bg-slate-50 dark:bg-[#121212]'
                        : 'bg-slate-100 dark:bg-[#151c24]';`;

const newCardBgClass = `const cardBg = isCutout
                        ? 'transparent-checkerboard-bg'
                        : 'bg-slate-100 dark:bg-[#151c24]';`;

if (html.includes(oldCardBgClass)) {
  html = html.replace(oldCardBgClass, newCardBgClass);
  console.log('✓ [index.html] Updated gallery card to transparent-checkerboard-bg');
}

// Update lightbox image styling
const oldLightboxImgStyle = `imgEl.className = 'max-h-[82vh] max-w-[88vw] w-auto object-contain rounded-xl shadow-2xl transition-all duration-200 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:8px_8px] p-2';`;
const newLightboxImgStyle = `imgEl.className = 'max-h-[82vh] max-w-[88vw] w-auto object-contain rounded-xl shadow-2xl transition-all duration-200 transparent-checkerboard-bg p-2';`;

if (html.includes(oldLightboxImgStyle)) {
  html = html.replace(oldLightboxImgStyle, newLightboxImgStyle);
  console.log('✓ [index.html] Updated lightbox image styling to transparent-checkerboard-bg');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Saved index.html successfully!');

// 2. UPDATE src/components/ImageWorkspace.tsx
let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

// Add removeBgFile state
const oldStateHook = `const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);`;
const newStateHook = `const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);
  const [removeBgFile, setRemoveBgFile] = useState<File | null>(null);`;

if (!tsx.includes('removeBgFile, setRemoveBgFile') && tsx.includes(oldStateHook)) {
  tsx = tsx.replace(oldStateHook, newStateHook);
  console.log('✓ [ImageWorkspace.tsx] Added removeBgFile state hook');
}

// Update file input onChange
const oldOnChange = `onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}`;

const newOnChange = `onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setRemoveBgFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}`;

if (tsx.includes(oldOnChange)) {
  tsx = tsx.replace(oldOnChange, newOnChange);
  console.log('✓ [ImageWorkspace.tsx] Updated file input onChange to store File');
}

// Update onDrop
const oldOnDrop = `onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}`;

const newOnDrop = `onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        setRemoveBgFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}`;

if (tsx.includes(oldOnDrop)) {
  tsx = tsx.replace(oldOnDrop, newOnDrop);
  console.log('✓ [ImageWorkspace.tsx] Updated onDrop to store File');
}

// Update clear button
const oldClearBtn = `onClick={(e) => {
                        e.stopPropagation();
                        setRemoveBgImage(null);
                        if (removeBgInputRef.current) removeBgInputRef.current.value = '';
                      }}`;

const newClearBtn = `onClick={(e) => {
                        e.stopPropagation();
                        setRemoveBgImage(null);
                        setRemoveBgFile(null);
                        if (removeBgInputRef.current) removeBgInputRef.current.value = '';
                      }}`;

if (tsx.includes(oldClearBtn)) {
  tsx = tsx.replace(oldClearBtn, newClearBtn);
  console.log('✓ [ImageWorkspace.tsx] Updated clear button to clear File');
}

// Update action button onClick handler in React
const oldTsxHandlerRegex = /onClick=\{async \(\) => \{\s+if \(!removeBgImage\) return;\s+setIsProcessingWorkflow\(true\);[\s\S]*?className=\{`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2/m;

const newTsxHandler = `onClick={async () => {
                  if (!removeBgImage && !removeBgFile) return;
                  setIsProcessingWorkflow(true);
                  try {
                    const sourceInput = removeBgFile || removeBgImage;
                    const config = {
                      publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.5.6/dist/',
                      debug: false
                    };
                    const imgly = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.6/+esm' as string);
                    const removeBackground = (imgly as any).removeBackground || (imgly as any).default;
                    const blob = await removeBackground(sourceInput, config);
                    if (!blob || blob.size === 0) throw new Error('Empty blob');
                    const transparentImageUrl = URL.createObjectURL(blob);

                    const tmpImg = new Image();
                    await new Promise((res) => {
                      tmpImg.onload = res;
                      tmpImg.onerror = res;
                      tmpImg.src = transparentImageUrl;
                    });
                    const outW = tmpImg.naturalWidth || 1024;
                    const outH = tmpImg.naturalHeight || 1024;

                    assets.unshift({
                      id: 'bg-removed-' + Date.now(),
                      url: transparentImageUrl,
                      prompt: 'Background Removed (Transparent Cutout)',
                      model: 'Transparent Cutout',
                      aspectRatio: \`\${outW}:\${outH}\`
                    });
                  } catch (err) {
                    console.error('BG removal error:', err);
                  } finally {
                    setIsProcessingWorkflow(false);
                  }
                }}
                className={\`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2`;

if (oldTsxHandlerRegex.test(tsx)) {
  tsx = tsx.replace(oldTsxHandlerRegex, newTsxHandler);
  console.log('✓ [ImageWorkspace.tsx] Replaced React remove-bg execution handler with exact @imgly 1.5.6 staticimgly CDN loader');
} else {
  console.error('✗ [ImageWorkspace.tsx] Could not find oldTsxHandlerRegex in ImageWorkspace.tsx');
}

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf8');
console.log('✓ Saved src/components/ImageWorkspace.tsx successfully!\n');

