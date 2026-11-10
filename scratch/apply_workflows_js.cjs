const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Update setImageStudioMode to handle options.tool
const setModeTarget = `                if (options.prompt) {
                    const studioPrompt = document.getElementById('studio-prompt-input');`;

const setModeReplacement = `                if (options.tool && typeof switchWorkflowTool === 'function') {
                    switchWorkflowTool(options.tool);
                }

                if (options.prompt) {
                    const studioPrompt = document.getElementById('studio-prompt-input');`;

if (!html.includes(setModeTarget)) {
    console.error('Could not find setModeTarget in index.html');
    process.exit(1);
}
html = html.replace(setModeTarget, setModeReplacement);
console.log('✓ Added options.tool handling to setImageStudioMode');

// 2. Update generateStudioImages to prepend vector constraint in vector mode
const genImagesTarget = `            const rawOriginalPrompt = (document.getElementById('studio-prompt-input')?.value || promptText).trim();

            if (activeStyle && activeStyle !== 'Auto' && activeStyle !== 'General') {`;

const genImagesReplacement = `            const rawOriginalPrompt = (document.getElementById('studio-prompt-input')?.value || promptText).trim();

            if (typeof activeWorkflowTool !== 'undefined' && activeWorkflowTool === 'vector-illustration') {
                const vectorPrefix = 'flat 2D vector graphic, clean sharp SVG lines, minimal gradients, isolated subject, sticker-cut vector art, professional graphic design illustration, ';
                if (!promptText.toLowerCase().includes('vector graphic') && !promptText.toLowerCase().includes('flat 2d vector')) {
                    promptText = vectorPrefix + promptText;
                }
            }

            if (activeStyle && activeStyle !== 'Auto' && activeStyle !== 'General') {`;

if (!html.includes(genImagesTarget)) {
    console.error('Could not find genImagesTarget in index.html');
    process.exit(1);
}
html = html.replace(genImagesTarget, genImagesReplacement);
console.log('✓ Added vector prompt constraint to generateStudioImages');

// 3. Add workspace-tool-flyout to closeAllStudioDropdowns
const closeDropsTarget = `            const drops = [
                document.getElementById('studio-ratio-dropdown'),`;

const closeDropsReplacement = `            const drops = [
                document.getElementById('workspace-tool-flyout'),
                document.getElementById('studio-ratio-dropdown'),`;

if (!html.includes(closeDropsTarget)) {
    console.error('Could not find closeDropsTarget in index.html');
    process.exit(1);
}
html = html.replace(closeDropsTarget, closeDropsReplacement);
console.log('✓ Added workspace-tool-flyout to closeAllStudioDropdowns');

// 4. Inject the creative workflows JS controller and listeners
const jsBlock = `
        // ═══════════════════════════════════════════════════════════════════
        // CREATIVE WORKFLOWS & WORKSPACE TOOL SWITCHER CONTROLLERS
        // ═══════════════════════════════════════════════════════════════════

        const WORKFLOW_TOOLS = [
            {
                id: 'generate-image',
                label: 'Generate Image',
                subtitle: 'Prompt to high-fidelity image',
                icon: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
            },
            {
                id: 'remove-background',
                label: 'Remove Background',
                subtitle: 'Instant transparent cutout',
                icon: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>'
            },
            {
                id: 'precise-edit',
                label: 'Precise Edit',
                subtitle: 'Selective inpaint & remixing',
                icon: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" stroke-dasharray="3 3"/><path d="m14 14 3 3m0-3-3 3"/><circle cx="9" cy="9" r="2"/></svg>'
            },
            {
                id: 'upscale-image',
                label: 'Upscale Image',
                subtitle: 'Enhance resolution & clarity',
                icon: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5-5 5 5"/><path d="m7 9 5-5 5 5"/></svg>'
            },
            {
                id: 'image-to-image',
                label: 'Image to Image',
                subtitle: 'Transform with visual guide',
                icon: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="2" y="2" rx="2"/><rect width="14" height="14" x="8" y="8" rx="2"/></svg>'
            },
            {
                id: 'vector-illustration',
                label: 'Vector Illustration',
                subtitle: 'Flat graphic, SVG-ready art',
                badge: 'NEW',
                icon: '<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>'
            }
        ];

        let activeWorkflowTool = 'generate-image';
        let removeBgSourceData = null;
        let upscaleSourceData = null;
        let img2imgSourceData = null;
        let activeUpscaleFactor = 2;

        function renderWorkflowFlyoutList(filterText = '') {
            const listEl = document.getElementById('workspace-tool-list');
            if (!listEl) return;
            const query = (filterText || '').toLowerCase().trim();
            const filtered = WORKFLOW_TOOLS.filter(t => 
                !query || t.label.toLowerCase().includes(query) || t.subtitle.toLowerCase().includes(query)
            );

            listEl.innerHTML = '';
            if (filtered.length === 0) {
                listEl.innerHTML = '<div class="px-3 py-4 text-center text-xs text-neutral-400">No workflows found</div>';
                return;
            }

            filtered.forEach(tool => {
                const isSelected = tool.id === activeWorkflowTool;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition cursor-pointer ' +
                    (isSelected 
                        ? 'bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-neutral-300');
                btn.dataset.toolId = tool.id;

                const leftDiv = document.createElement('div');
                leftDiv.className = 'flex items-center gap-2.5 min-w-0';

                const iconWrap = document.createElement('div');
                iconWrap.className = 'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ' +
                    (isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400');
                iconWrap.innerHTML = tool.icon;
                leftDiv.appendChild(iconWrap);

                const textDiv = document.createElement('div');
                textDiv.className = 'min-w-0 flex flex-col';

                const titleRow = document.createElement('div');
                titleRow.className = 'flex items-center gap-1.5';
                const titleSpan = document.createElement('span');
                titleSpan.className = 'text-xs truncate font-medium';
                titleSpan.textContent = tool.label;
                titleRow.appendChild(titleSpan);

                if (tool.badge) {
                    const badgeSpan = document.createElement('span');
                    badgeSpan.className = 'px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';
                    badgeSpan.textContent = tool.badge;
                    titleRow.appendChild(badgeSpan);
                }
                textDiv.appendChild(titleRow);

                const subSpan = document.createElement('span');
                subSpan.className = 'text-[10px] text-neutral-400 dark:text-neutral-500 truncate';
                subSpan.textContent = tool.subtitle;
                textDiv.appendChild(subSpan);

                leftDiv.appendChild(textDiv);
                btn.appendChild(leftDiv);

                if (isSelected) {
                    const chk = document.createElement('div');
                    chk.className = 'shrink-0 ml-2 text-blue-600 dark:text-blue-400';
                    chk.innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
                    btn.appendChild(chk);
                }

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    switchWorkflowTool(tool.id);
                });

                listEl.appendChild(btn);
            });
        }

        function switchWorkflowTool(toolId) {
            const found = WORKFLOW_TOOLS.find(t => t.id === toolId);
            if (!found) return;
            activeWorkflowTool = toolId;

            // Update active label in header
            const activeLabel = document.getElementById('workspace-active-tool-label');
            if (activeLabel) activeLabel.textContent = found.label;

            // Close flyout
            const flyout = document.getElementById('workspace-tool-flyout');
            const chevron = document.getElementById('workspace-tool-switcher-chevron');
            if (flyout) flyout.classList.add('hidden');
            if (chevron) chevron.classList.remove('rotate-180');

            renderWorkflowFlyoutList();

            // Toggle panels in left sidebar
            const genControls = document.getElementById('ideogram-generate-controls');
            const editControls = document.getElementById('ideogram-precise-edit-controls');
            const removeBgControls = document.getElementById('ideogram-remove-bg-controls');
            const upscaleControls = document.getElementById('ideogram-upscale-controls');
            const img2imgControls = document.getElementById('ideogram-img2img-controls');
            const vectorBanner = document.getElementById('vector-mode-banner');

            if (genControls) genControls.classList.add('hidden');
            if (editControls) editControls.classList.add('hidden');
            if (removeBgControls) removeBgControls.classList.add('hidden');
            if (upscaleControls) upscaleControls.classList.add('hidden');
            if (img2imgControls) img2imgControls.classList.add('hidden');
            if (vectorBanner) vectorBanner.classList.add('hidden');

            const genHeader = document.getElementById('ideogram-header-generate');
            const editHeader = document.getElementById('ideogram-header-edit');
            if (genHeader) { genHeader.classList.remove('hidden'); genHeader.classList.add('flex'); }
            if (editHeader) { editHeader.classList.add('hidden'); editHeader.classList.remove('flex'); }

            if (toolId === 'generate-image') {
                if (genControls) genControls.classList.remove('hidden');
            } else if (toolId === 'vector-illustration') {
                if (genControls) genControls.classList.remove('hidden');
                if (vectorBanner) vectorBanner.classList.remove('hidden');
            } else if (toolId === 'remove-background') {
                if (removeBgControls) removeBgControls.classList.remove('hidden');
            } else if (toolId === 'upscale-image') {
                if (upscaleControls) upscaleControls.classList.remove('hidden');
            } else if (toolId === 'image-to-image') {
                if (img2imgControls) img2imgControls.classList.remove('hidden');
            } else if (toolId === 'precise-edit') {
                if (editControls) editControls.classList.remove('hidden');
                if (!studioPreciseEditState.sourceItem && Array.isArray(STUDIO_RECENT_IMAGES) && STUDIO_RECENT_IMAGES.length > 0) {
                    const item = STUDIO_RECENT_IMAGES[0];
                    studioPreciseEditState.sourceItem = item;
                    const thumbEl = document.getElementById('studio-precise-edit-thumb');
                    const titleEl = document.getElementById('studio-precise-edit-source-title');
                    if (thumbEl) thumbEl.src = item.url || item.img || '';
                    if (titleEl) titleEl.textContent = item.originalPrompt || item.prompt || item.title || 'Original Image';
                }
            }
        }

        function initCreativeWorkflows() {
            // 1. Carousel horizontal scroll buttons
            const scrollLeftBtn = document.getElementById('workflow-scroll-left');
            const scrollRightBtn = document.getElementById('workflow-scroll-right');
            const carouselEl = document.getElementById('creative-workflows-carousel');

            if (scrollLeftBtn && carouselEl) {
                scrollLeftBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    carouselEl.scrollBy({ left: -300, behavior: 'smooth' });
                });
            }
            if (scrollRightBtn && carouselEl) {
                scrollRightBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    carouselEl.scrollBy({ left: 300, behavior: 'smooth' });
                });
            }

            // 2. Carousel card click listener -> routes directly to Image Workspace in target tool mode
            document.querySelectorAll('.workflow-carousel-card').forEach(card => {
                card.addEventListener('click', () => {
                    const toolId = card.getAttribute('data-workflow-tool');
                    if (toolId) {
                        setImageStudioMode('workspace', { tool: toolId });
                    }
                });
            });

            // 3. Workspace Dropdown App Switcher
            const switcherBtn = document.getElementById('workspace-tool-switcher-btn');
            const switcherFlyout = document.getElementById('workspace-tool-flyout');
            const switcherChevron = document.getElementById('workspace-tool-switcher-chevron');
            const searchInput = document.getElementById('workspace-tool-search-input');

            if (switcherBtn && switcherFlyout) {
                renderWorkflowFlyoutList();

                switcherBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isClosed = switcherFlyout.classList.contains('hidden');
                    closeAllStudioDropdowns();
                    if (isClosed) {
                        switcherFlyout.classList.remove('hidden');
                        if (switcherChevron) switcherChevron.classList.add('rotate-180');
                        if (searchInput) {
                            searchInput.value = '';
                            renderWorkflowFlyoutList('');
                            setTimeout(() => searchInput.focus(), 50);
                        }
                    } else {
                        switcherFlyout.classList.add('hidden');
                        if (switcherChevron) switcherChevron.classList.remove('rotate-180');
                    }
                });

                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        renderWorkflowFlyoutList(e.target.value);
                    });
                    searchInput.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                }

                document.addEventListener('click', (e) => {
                    const wrapper = document.getElementById('workspace-tool-switcher-wrapper');
                    if (wrapper && !wrapper.contains(e.target)) {
                        switcherFlyout.classList.add('hidden');
                        if (switcherChevron) switcherChevron.classList.remove('rotate-180');
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && switcherFlyout && !switcherFlyout.classList.contains('hidden')) {
                        switcherFlyout.classList.add('hidden');
                        if (switcherChevron) switcherChevron.classList.remove('rotate-180');
                    }
                });
            }

            // 4. Remove Background Pipeline
            const removeBgUploadZone = document.getElementById('remove-bg-upload-zone');
            const removeBgFileInput = document.getElementById('remove-bg-file-input');
            const removeBgPreviewWrapper = document.getElementById('remove-bg-preview-wrapper');
            const removeBgPreviewImg = document.getElementById('remove-bg-preview-img');
            const removeBgRemoveBtn = document.getElementById('remove-bg-remove-file-btn');
            const btnDoRemoveBg = document.getElementById('btn-do-remove-bg');
            const btnDoRemoveBgText = document.getElementById('btn-do-remove-bg-text');

            function handleRemoveBgFile(file) {
                if (!file || !file.type.startsWith('image/')) {
                    showStudioToast('Please upload a valid image file');
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
                        btnDoRemoveBg.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-98';
                    }
                };
                reader.readAsDataURL(file);
            }

            if (removeBgUploadZone && removeBgFileInput) {
                removeBgUploadZone.addEventListener('click', () => removeBgFileInput.click());
                removeBgFileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) handleRemoveBgFile(e.target.files[0]);
                });
                removeBgUploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    removeBgUploadZone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                });
                removeBgUploadZone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    removeBgUploadZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                });
                removeBgUploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    removeBgUploadZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleRemoveBgFile(e.dataTransfer.files[0]);
                    }
                });
            }

            if (removeBgRemoveBtn) {
                removeBgRemoveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeBgSourceData = null;
                    if (removeBgFileInput) removeBgFileInput.value = '';
                    if (removeBgPreviewWrapper) removeBgPreviewWrapper.classList.add('hidden');
                    if (removeBgUploadZone) removeBgUploadZone.classList.remove('hidden');
                    if (btnDoRemoveBg) {
                        btnDoRemoveBg.disabled = true;
                        btnDoRemoveBg.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed';
                    }
                });
            }

            if (btnDoRemoveBg) {
                btnDoRemoveBg.addEventListener('click', async () => {
                    if (!removeBgSourceData) return;
                    btnDoRemoveBg.disabled = true;
                    if (btnDoRemoveBgText) btnDoRemoveBgText.textContent = 'Removing Background...';

                    try {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        await new Promise((res, rej) => {
                            img.onload = res;
                            img.onerror = rej;
                            img.src = removeBgSourceData;
                        });

                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imgData.data;
                        const w = canvas.width;
                        const h = canvas.height;

                        const sampleCoords = [
                            [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
                            [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
                            [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1]
                        ];
                        let sumR = 0, sumG = 0, sumB = 0;
                        sampleCoords.forEach(([x, y]) => {
                            const idx = (y * w + x) * 4;
                            sumR += data[idx];
                            sumG += data[idx + 1];
                            sumB += data[idx + 2];
                        });
                        const bgR = sumR / sampleCoords.length;
                        const bgG = sumG / sampleCoords.length;
                        const bgB = sumB / sampleCoords.length;

                        const threshold = 54;
                        const feather = threshold * 0.7;

                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

                            if (dist < feather) {
                                data[i + 3] = 0;
                            } else if (dist < threshold) {
                                const factor = (dist - feather) / (threshold - feather);
                                data[i + 3] = Math.round(data[i + 3] * factor);
                            }
                        }

                        ctx.putImageData(imgData, 0, 0);
                        const resultUrl = canvas.toDataURL('image/png');

                        const item = {
                            id: 'bg-removed-' + Date.now(),
                            url: resultUrl,
                            img: resultUrl,
                            title: 'Background Removed',
                            prompt: 'Background Removed (Transparent PNG)',
                            originalPrompt: 'Background Removed (Transparent PNG)',
                            model: 'Canvas Cutout',
                            aspectRatio: w + ':' + h,
                            createdAt: new Date().toISOString()
                        };

                        STUDIO_RECENT_IMAGES.unshift(item);
                        renderStudioAssetsGallery();
                        showStudioToast('Background removed successfully!');
                    } catch (err) {
                        console.error('BG removal error:', err);
                        showStudioToast('Failed to remove background.');
                    } finally {
                        btnDoRemoveBg.disabled = false;
                        if (btnDoRemoveBgText) btnDoRemoveBgText.textContent = 'Remove Background';
                    }
                });
            }

            // 5. Upscale Image Pipeline
            const upscaleUploadZone = document.getElementById('upscale-upload-zone');
            const upscaleFileInput = document.getElementById('upscale-file-input');
            const upscalePreviewWrapper = document.getElementById('upscale-preview-wrapper');
            const upscalePreviewImg = document.getElementById('upscale-preview-img');
            const upscaleRemoveBtn = document.getElementById('upscale-remove-file-btn');
            const btnDoUpscale = document.getElementById('btn-do-upscale');
            const btnDoUpscaleText = document.getElementById('btn-do-upscale-text');

            function handleUpscaleFile(file) {
                if (!file || !file.type.startsWith('image/')) {
                    showStudioToast('Please upload a valid image file');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    upscaleSourceData = e.target.result;
                    if (upscalePreviewImg) upscalePreviewImg.src = upscaleSourceData;
                    if (upscalePreviewWrapper) upscalePreviewWrapper.classList.remove('hidden');
                    if (upscaleUploadZone) upscaleUploadZone.classList.add('hidden');
                    if (btnDoUpscale) {
                        btnDoUpscale.disabled = false;
                        btnDoUpscale.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-98';
                    }
                };
                reader.readAsDataURL(file);
            }

            if (upscaleUploadZone && upscaleFileInput) {
                upscaleUploadZone.addEventListener('click', () => upscaleFileInput.click());
                upscaleFileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) handleUpscaleFile(e.target.files[0]);
                });
                upscaleUploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    upscaleUploadZone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                });
                upscaleUploadZone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    upscaleUploadZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                });
                upscaleUploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    upscaleUploadZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleUpscaleFile(e.dataTransfer.files[0]);
                    }
                });
            }

            if (upscaleRemoveBtn) {
                upscaleRemoveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    upscaleSourceData = null;
                    if (upscaleFileInput) upscaleFileInput.value = '';
                    if (upscalePreviewWrapper) upscalePreviewWrapper.classList.add('hidden');
                    if (upscaleUploadZone) upscaleUploadZone.classList.remove('hidden');
                    if (btnDoUpscale) {
                        btnDoUpscale.disabled = true;
                        btnDoUpscale.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed';
                    }
                });
            }

            document.querySelectorAll('.upscale-factor-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const factor = parseInt(btn.dataset.scale || '2', 10);
                    activeUpscaleFactor = factor;
                    document.querySelectorAll('.upscale-factor-btn').forEach(b => {
                        const isMatch = parseInt(b.dataset.scale || '2', 10) === factor;
                        b.className = 'upscale-factor-btn flex-1 py-2 rounded-lg border text-xs transition-all cursor-pointer text-center ' +
                            (isMatch
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300');
                    });
                });
            });

            if (btnDoUpscale) {
                btnDoUpscale.addEventListener('click', async () => {
                    if (!upscaleSourceData) return;
                    btnDoUpscale.disabled = true;
                    const factor = activeUpscaleFactor || 2;
                    if (btnDoUpscaleText) btnDoUpscaleText.textContent = 'Upscaling ' + factor + 'x...';

                    try {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        await new Promise((res, rej) => {
                            img.onload = res;
                            img.onerror = rej;
                            img.src = upscaleSourceData;
                        });

                        const targetW = (img.naturalWidth || img.width) * factor;
                        const targetH = (img.naturalHeight || img.height) * factor;

                        const canvas = document.createElement('canvas');
                        canvas.width = targetW;
                        canvas.height = targetH;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, targetW, targetH);

                        const srcData = ctx.getImageData(0, 0, targetW, targetH);
                        const dstCanvas = document.createElement('canvas');
                        dstCanvas.width = targetW;
                        dstCanvas.height = targetH;
                        const dstCtx = dstCanvas.getContext('2d');
                        const dstData = dstCtx.createImageData(targetW, targetH);

                        const s = srcData.data;
                        const d = dstData.data;
                        const w = targetW;
                        const h = targetH;

                        for (let y = 1; y < h - 1; y++) {
                            for (let x = 1; x < w - 1; x++) {
                                const idx = (y * w + x) * 4;
                                for (let c = 0; c < 3; c++) {
                                    const val = 1.7 * s[idx + c]
                                        - 0.175 * s[((y - 1) * w + x) * 4 + c]
                                        - 0.175 * s[((y + 1) * w + x) * 4 + c]
                                        - 0.175 * s[(y * w + (x - 1)) * 4 + c]
                                        - 0.175 * s[(y * w + (x + 1)) * 4 + c];
                                    d[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
                                }
                                d[idx + 3] = s[idx + 3];
                            }
                        }
                        dstCtx.putImageData(dstData, 0, 0);
                        const resultUrl = dstCanvas.toDataURL('image/jpeg', 0.95);

                        const item = {
                            id: 'upscaled-' + Date.now(),
                            url: resultUrl,
                            img: resultUrl,
                            title: 'Upscaled ' + factor + 'x',
                            prompt: 'Upscaled ' + factor + 'x (' + targetW + '×' + targetH + ')',
                            originalPrompt: 'Upscaled ' + factor + 'x (' + targetW + '×' + targetH + ')',
                            model: 'Super Resolution ' + factor + 'x',
                            aspectRatio: targetW + ':' + targetH,
                            createdAt: new Date().toISOString()
                        };

                        STUDIO_RECENT_IMAGES.unshift(item);
                        renderStudioAssetsGallery();
                        showStudioToast('Image upscaled to ' + factor + 'x (' + targetW + '×' + targetH + ')!');
                    } catch (err) {
                        console.error('Upscale error:', err);
                        showStudioToast('Failed to upscale image.');
                    } finally {
                        btnDoUpscale.disabled = false;
                        if (btnDoUpscaleText) btnDoUpscaleText.textContent = 'Upscale Image';
                    }
                });
            }

            // 6. Image to Image Pipeline
            const img2imgUploadZone = document.getElementById('img2img-upload-zone');
            const img2imgFileInput = document.getElementById('img2img-file-input');
            const img2imgPreviewWrapper = document.getElementById('img2img-preview-wrapper');
            const img2imgPreviewImg = document.getElementById('img2img-preview-img');
            const img2imgRemoveBtn = document.getElementById('img2img-remove-file-btn');
            const img2imgStrengthSlider = document.getElementById('img2img-strength-slider');
            const img2imgStrengthVal = document.getElementById('img2img-strength-val');
            const img2imgPromptInput = document.getElementById('img2img-prompt-input');
            const btnDoImg2Img = document.getElementById('btn-do-img2img');

            function syncImg2ImgButtonState() {
                if (!btnDoImg2Img) return;
                const hasImage = !!img2imgSourceData;
                const hasPrompt = img2imgPromptInput && img2imgPromptInput.value.trim().length > 0;
                const isValid = hasImage && hasPrompt;
                btnDoImg2Img.disabled = !isValid;
                if (isValid) {
                    btnDoImg2Img.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-98';
                } else {
                    btnDoImg2Img.className = 'w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed';
                }
            }

            function handleImg2ImgFile(file) {
                if (!file || !file.type.startsWith('image/')) {
                    showStudioToast('Please upload a valid image file');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    img2imgSourceData = e.target.result;
                    if (img2imgPreviewImg) img2imgPreviewImg.src = img2imgSourceData;
                    if (img2imgPreviewWrapper) img2imgPreviewWrapper.classList.remove('hidden');
                    if (img2imgUploadZone) img2imgUploadZone.classList.add('hidden');
                    syncImg2ImgButtonState();
                };
                reader.readAsDataURL(file);
            }

            if (img2imgUploadZone && img2imgFileInput) {
                img2imgUploadZone.addEventListener('click', () => img2imgFileInput.click());
                img2imgFileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) handleImg2ImgFile(e.target.files[0]);
                });
                img2imgUploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    img2imgUploadZone.classList.add('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                });
                img2imgUploadZone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    img2imgUploadZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                });
                img2imgUploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    img2imgUploadZone.classList.remove('border-blue-500', 'bg-blue-50/50', 'dark:bg-blue-500/10');
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImg2ImgFile(e.dataTransfer.files[0]);
                    }
                });
            }

            if (img2imgRemoveBtn) {
                img2imgRemoveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    img2imgSourceData = null;
                    if (img2imgFileInput) img2imgFileInput.value = '';
                    if (img2imgPreviewWrapper) img2imgPreviewWrapper.classList.add('hidden');
                    if (img2imgUploadZone) img2imgUploadZone.classList.remove('hidden');
                    syncImg2ImgButtonState();
                });
            }

            if (img2imgStrengthSlider) {
                img2imgStrengthSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    if (img2imgStrengthVal) img2imgStrengthVal.textContent = Math.round(val * 100) + '%';
                });
            }

            if (img2imgPromptInput) {
                img2imgPromptInput.addEventListener('input', syncImg2ImgButtonState);
            }

            if (btnDoImg2Img) {
                btnDoImg2Img.addEventListener('click', () => {
                    const prompt = (img2imgPromptInput ? img2imgPromptInput.value : '').trim();
                    if (!prompt || !img2imgSourceData) return;
                    generateStudioImages(prompt, '1:1', img2imgSourceData);
                });
            }
        }
`;

// Insert jsBlock right after `initImageHomeView()` definition
const initHomeEnd = `            if (viewAllBtn) {
                viewAllBtn.addEventListener('click', () => {
                    setImageStudioMode('workspace');
                });
            }
        }`;

if (!html.includes(initHomeEnd)) {
    console.error('Could not find initHomeEnd in index.html');
    process.exit(1);
}
html = html.replace(initHomeEnd, initHomeEnd + '\n' + jsBlock);
console.log('✓ Injected CREATIVE WORKFLOWS controller functions');

// 5. Call initCreativeWorkflows() in initImageStudio()
const initStudioTarget = `        function initImageStudio() {
            if (typeof initImageHomeView === 'function') {
                initImageHomeView();
            }`;

const initStudioReplacement = `        function initImageStudio() {
            if (typeof initImageHomeView === 'function') {
                initImageHomeView();
            }
            if (typeof initCreativeWorkflows === 'function') {
                initCreativeWorkflows();
            }`;

if (!html.includes(initStudioTarget)) {
    console.error('Could not find initStudioTarget in index.html');
    process.exit(1);
}
html = html.replace(initStudioTarget, initStudioReplacement);
console.log('✓ Added initCreativeWorkflows() call to initImageStudio()');

// 6. Update exitStudioPreciseEdit to switch workflow tool to generate-image
const exitPreciseTarget = `        function exitStudioPreciseEdit() {
            studioPreciseEditState.isActive = false;
            studioPreciseEditState.sourceItem = null;
            studioPreciseEditState.sourceCard = null;
            studioPreciseEditState.referenceImages = [];`;

const exitPreciseReplacement = `        function exitStudioPreciseEdit() {
            studioPreciseEditState.isActive = false;
            studioPreciseEditState.sourceItem = null;
            studioPreciseEditState.sourceCard = null;
            studioPreciseEditState.referenceImages = [];
            if (typeof switchWorkflowTool === 'function') {
                switchWorkflowTool('generate-image');
            }`;

if (!html.includes(exitPreciseTarget)) {
    console.error('Could not find exitPreciseTarget in index.html');
    process.exit(1);
}
html = html.replace(exitPreciseTarget, exitPreciseReplacement);
console.log('✓ Updated exitStudioPreciseEdit with switchWorkflowTool');

// 7. Update enterStudioPreciseEdit to sync tool label and activeWorkflowTool
const enterPreciseTarget = `            studioPreciseEditState.variationCount = 1;
            studioPreciseEditState.referenceImages = [];

            imageStudioMode = 'workspace';`;

const enterPreciseReplacement = `            studioPreciseEditState.variationCount = 1;
            studioPreciseEditState.referenceImages = [];
            if (typeof activeWorkflowTool !== 'undefined') {
                activeWorkflowTool = 'precise-edit';
                const activeLabel = document.getElementById('workspace-active-tool-label');
                if (activeLabel) activeLabel.textContent = 'Precise Edit';
                if (typeof renderWorkflowFlyoutList === 'function') renderWorkflowFlyoutList();
            }

            imageStudioMode = 'workspace';`;

if (!html.includes(enterPreciseTarget)) {
    console.error('Could not find enterPreciseTarget in index.html');
    process.exit(1);
}
html = html.replace(enterPreciseTarget, enterPreciseReplacement);
console.log('✓ Updated enterStudioPreciseEdit with activeWorkflowTool syncing');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully written JavaScript updates to index.html!');

