const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Locate and replace the remove-bg markup inside left panel
const startMarkup = '<!-- REMOVE BACKGROUND CONTROLS (ZERO-COST INSTANT CUTOUT) -->';
const endMarkup = '<!-- UPSCALE IMAGE CONTROLS';

const startIdx = html.indexOf(startMarkup);
const endIdx = html.indexOf(endMarkup);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find startMarkup or endMarkup in index.html');
    process.exit(1);
}

const newMarkup = `<!-- REMOVE BACKGROUND CONTROLS (IDEOGRAM MINIMALIST PIPELINE) -->
                    <div id="ideogram-remove-bg-controls" class="hidden space-y-4">
                        <div class="space-y-1.5">
                            <label class="text-xs font-medium text-neutral-500 block mb-2">Source image</label>
                            
                            <!-- Hidden File Input -->
                            <input type="file" id="remove-bg-file-input" accept="image/png,image/jpeg,image/webp" class="hidden">
                            
                            <!-- Dropzone (Empty State) -->
                            <div id="remove-bg-upload-zone" class="relative w-full min-h-[220px] rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-transparent transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400 font-normal">Upload or choose an image</span>
                                <button type="button" id="remove-bg-add-btn" class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
                                    <span>+ Add</span>
                                </button>
                            </div>

                            <!-- Uploaded Image Preview (Filled State) -->
                            <div id="remove-bg-preview-wrapper" class="hidden relative w-full h-[220px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-2">
                                <img id="remove-bg-preview-img" src="" alt="Source preview" class="w-full h-full object-contain rounded-xl">
                                <button type="button" id="remove-bg-remove-file-btn" class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md" title="Change image">✕</button>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <button type="button" id="btn-do-remove-bg" disabled class="w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed">
                            <span id="btn-do-remove-bg-text">Remove background</span>
                        </button>
                    </div>

                    `;

html = html.substring(0, startIdx) + newMarkup + html.substring(endIdx);
console.log('✓ Replaced Remove Background markup with Ideogram minimalist layout in index.html');

// 2. Locate and replace the Remove Background JS controller
const startJs = '// 4. Remove Background Pipeline';
const endJs = '// 5. Upscale Image Pipeline';

const startJsIdx = html.indexOf(startJs);
const endJsIdx = html.indexOf(endJs);

if (startJsIdx === -1 || endJsIdx === -1) {
    console.error('Could not find startJs or endJs in index.html');
    process.exit(1);
}

const newJs = `// 4. Remove Background Pipeline (Ideogram Minimalist & High-Accuracy Boundary Cutout)
            const removeBgUploadZone = document.getElementById('remove-bg-upload-zone');
            const removeBgAddBtn = document.getElementById('remove-bg-add-btn');
            const removeBgFileInput = document.getElementById('remove-bg-file-input');
            const removeBgPreviewWrapper = document.getElementById('remove-bg-preview-wrapper');
            const removeBgPreviewImg = document.getElementById('remove-bg-preview-img');
            const removeBgRemoveBtn = document.getElementById('remove-bg-remove-file-btn');
            const btnDoRemoveBg = document.getElementById('btn-do-remove-bg');
            const btnDoRemoveBgText = document.getElementById('btn-do-remove-bg-text');

            function handleRemoveBgFile(file) {
                if (!file || !file.type.startsWith('image/')) {
                    showStudioToast('Please upload a valid image file (PNG, JPG, or WebP)');
                    return;
                }
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
                    if (!removeBgSourceData) return;
                    btnDoRemoveBg.disabled = true;
                    if (btnDoRemoveBgText) btnDoRemoveBgText.textContent = 'Removing background...';

                    try {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        await new Promise((res, rej) => {
                            img.onload = res;
                            img.onerror = rej;
                            img.src = removeBgSourceData;
                        });

                        const w = img.naturalWidth || img.width;
                        const h = img.naturalHeight || img.height;
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        ctx.drawImage(img, 0, 0);

                        const imgData = ctx.getImageData(0, 0, w, h);
                        const data = imgData.data;
                        const totalPixels = w * h;

                        // Sample outer perimeter pixels to determine background reference tone
                        let sumR = 0, sumG = 0, sumB = 0;
                        let sampleCount = 0;
                        for (let x = 0; x < w; x++) {
                            const tIdx = x * 4;
                            const bIdx = ((h - 1) * w + x) * 4;
                            sumR += data[tIdx] + data[bIdx];
                            sumG += data[tIdx + 1] + data[bIdx + 1];
                            sumB += data[tIdx + 2] + data[bIdx + 2];
                            sampleCount += 2;
                        }
                        for (let y = 1; y < h - 1; y++) {
                            const lIdx = (y * w) * 4;
                            const rIdx = (y * w + (w - 1)) * 4;
                            sumR += data[lIdx] + data[rIdx];
                            sumG += data[lIdx + 1] + data[rIdx + 1];
                            sumB += data[lIdx + 2] + data[rIdx + 2];
                            sampleCount += 2;
                        }
                        const bgR = sumR / sampleCount;
                        const bgG = sumG / sampleCount;
                        const bgB = sumB / sampleCount;

                        // Boundary-seeded BFS flood-fill for precision cutout
                        const isBg = new Uint8Array(totalPixels);
                        const queue = new Int32Array(totalPixels);
                        let qHead = 0;
                        let qTail = 0;

                        const tolerance = 48;
                        const tolSq = tolerance * tolerance;
                        const seedTolSq = tolSq * 1.6;

                        // Seed from top & bottom edges
                        for (let x = 0; x < w; x++) {
                            const topP = x;
                            const botP = (h - 1) * w + x;
                            [topP, botP].forEach(p => {
                                if (!isBg[p]) {
                                    const idx = p * 4;
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    if (dr * dr + dg * dg + db * db <= seedTolSq) {
                                        isBg[p] = 1;
                                        queue[qTail++] = p;
                                    }
                                }
                            });
                        }
                        // Seed from left & right edges
                        for (let y = 1; y < h - 1; y++) {
                            const leftP = y * w;
                            const rightP = y * w + (w - 1);
                            [leftP, rightP].forEach(p => {
                                if (!isBg[p]) {
                                    const idx = p * 4;
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    if (dr * dr + dg * dg + db * db <= seedTolSq) {
                                        isBg[p] = 1;
                                        queue[qTail++] = p;
                                    }
                                }
                            });
                        }

                        // Propagate 4-way BFS
                        while (qHead < qTail) {
                            const curr = queue[qHead++];
                            const cx = curr % w;
                            const cy = (curr / w) | 0;

                            if (cx > 0) {
                                const next = curr - 1;
                                if (!isBg[next]) {
                                    const idx = next * 4;
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    if (dr * dr + dg * dg + db * db <= tolSq) {
                                        isBg[next] = 1;
                                        queue[qTail++] = next;
                                    }
                                }
                            }
                            if (cx < w - 1) {
                                const next = curr + 1;
                                if (!isBg[next]) {
                                    const idx = next * 4;
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    if (dr * dr + dg * dg + db * db <= tolSq) {
                                        isBg[next] = 1;
                                        queue[qTail++] = next;
                                    }
                                }
                            }
                            if (cy > 0) {
                                const next = curr - w;
                                if (!isBg[next]) {
                                    const idx = next * 4;
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    if (dr * dr + dg * dg + db * db <= tolSq) {
                                        isBg[next] = 1;
                                        queue[qTail++] = next;
                                    }
                                }
                            }
                            if (cy < h - 1) {
                                const next = curr + w;
                                if (!isBg[next]) {
                                    const idx = next * 4;
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    if (dr * dr + dg * dg + db * db <= tolSq) {
                                        isBg[next] = 1;
                                        queue[qTail++] = next;
                                    }
                                }
                            }
                        }

                        // Soft alpha edge feathering for smooth transparent cutout
                        const featherDistSq = (tolerance * 1.3) * (tolerance * 1.3);
                        for (let p = 0; p < totalPixels; p++) {
                            const idx = p * 4;
                            if (isBg[p]) {
                                data[idx + 3] = 0;
                            } else {
                                const px = p % w;
                                const py = (p / w) | 0;
                                const hasBgNeighbor = 
                                    (px > 0 && isBg[p - 1]) ||
                                    (px < w - 1 && isBg[p + 1]) ||
                                    (py > 0 && isBg[p - w]) ||
                                    (py < h - 1 && isBg[p + w]);
                                if (hasBgNeighbor) {
                                    const dr = data[idx] - bgR;
                                    const dg = data[idx + 1] - bgG;
                                    const db = data[idx + 2] - bgB;
                                    const distSq = dr * dr + dg * dg + db * db;
                                    if (distSq <= featherDistSq) {
                                        const factor = Math.sqrt(distSq) / (tolerance * 1.3);
                                        data[idx + 3] = Math.round(data[idx + 3] * factor);
                                    }
                                }
                            }
                        }

                        ctx.putImageData(imgData, 0, 0);
                        const resultUrl = canvas.toDataURL('image/png');

                        const item = {
                            id: 'bg-removed-' + Date.now(),
                            url: resultUrl,
                            img: resultUrl,
                            title: 'Background Removed',
                            prompt: 'Background Removed (Transparent Cutout)',
                            originalPrompt: 'Background Removed (Transparent Cutout)',
                            model: 'Transparent Cutout',
                            aspectRatio: w + ':' + h,
                            createdAt: new Date().toISOString()
                        };

                        STUDIO_RECENT_IMAGES.unshift(item);
                        if (typeof renderStudioAssetsGallery === 'function') {
                            renderStudioAssetsGallery();
                        }
                        showStudioToast('Background removed successfully!');
                    } catch (err) {
                        console.error('BG removal error:', err);
                        showStudioToast('Failed to remove background.');
                    } finally {
                        btnDoRemoveBg.disabled = false;
                        if (btnDoRemoveBgText) btnDoRemoveBgText.textContent = 'Remove background';
                    }
                });
            }

            `;

html = html.substring(0, startJsIdx) + newJs + html.substring(endJsIdx);
console.log('✓ Replaced Remove Background JS pipeline in index.html');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully saved index.html!');
