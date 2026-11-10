const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Layout Container: Replace max-w-5xl mx-auto with left-aligned full width and clean responsive padding
const oldContainer = '<div class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 pb-12 flex flex-col gap-10 relative z-10">';
const newContainer = '<div class="flex-1 w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-10 sm:pt-14 pb-16 flex flex-col gap-10 relative z-10">';

if (!html.includes(oldContainer)) {
  throw new Error('Container target not found in index.html');
}
html = html.replace(oldContainer, newContainer);
console.log('✓ Updated layout container to left-aligned full-width canvas');

// 2. Typography: Section Headings matching text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 and remove subtitle
const oldHeadings = `                <!-- Recent Creations Section -->
                <div class="w-full flex flex-col gap-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <h2 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Creations</h2>
                            <span id="image-home-recent-count" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">0</span>
                        </div>
                        <button type="button" id="image-home-view-all-btn" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all in Workspace</button>
                    </div>
                    <!-- Recent Creations Grid / Empty State -->
                    <div id="image-home-recent-grid" class="w-full">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Design Templates Section -->
                <div class="w-full flex flex-col gap-3.5 pb-12">
                    <div class="flex flex-col gap-0.5">
                        <h2 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">Design Templates & Styles</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Curated aesthetic styles and prompts ready for generation and smart editing.</p>
                    </div>
                    <!-- Templates Grid -->
                    <div id="image-home-templates-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <!-- Dynamically populated with 3 quick action buttons on each -->
                    </div>
                </div>`;

const newHeadings = `                <!-- Recent Creations Section -->
                <div class="w-full flex flex-col gap-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Recent Creations</h2>
                            <span id="image-home-recent-count" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">0</span>
                        </div>
                        <button type="button" id="image-home-view-all-btn" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all in Workspace</button>
                    </div>
                    <!-- Recent Creations Grid / Empty State -->
                    <div id="image-home-recent-grid" class="w-full">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Design Templates Section -->
                <div class="w-full flex flex-col gap-3.5 pb-12">
                    <div class="flex items-center">
                        <h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Design Templates & Styles</h2>
                    </div>
                    <!-- Templates Grid -->
                    <div id="image-home-templates-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        <!-- Dynamically populated with 3 quick action buttons on each -->
                    </div>
                </div>`;

if (!html.includes(oldHeadings)) {
  throw new Error('Headings target not found in index.html');
}
html = html.replace(oldHeadings, newHeadings);
console.log('✓ Updated headings typography & removed subtitle');

// 3. Replace renderImageHomeCreations & renderImageHomeTemplates
const creationsStart = html.indexOf('function renderImageHomeCreations()');
const modeStart = html.indexOf('function setImageStudioMode(mode, options = {})', creationsStart);

if (creationsStart === -1 || modeStart === -1) {
  throw new Error('Could not find JS functions region');
}

const newFunctionsJs = `function renderImageHomeCreations() {
            const grid = document.getElementById('image-home-recent-grid');
            const countBadge = document.getElementById('image-home-recent-count');
            if (!grid) return;

            const list = Array.isArray(STUDIO_RECENT_IMAGES) ? STUDIO_RECENT_IMAGES : [];
            if (countBadge) countBadge.textContent = list.length;

            if (list.length === 0) {
                grid.className = "w-full";
                grid.innerHTML = \`
                    <div class="w-full py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] flex flex-col items-center justify-center text-center">
                        <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                        </div>
                        <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">No creations yet</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">Enter a prompt above or pick a style template below to generate your first artwork.</p>
                    </div>
                \`;
                return;
            }

            grid.className = "w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4";
            grid.innerHTML = '';

            list.slice(0, 18).forEach((item) => {
                const card = document.createElement('div');
                card.className = "group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-[#1f1f1f] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer select-none";

                const imgUrl = item.url || item.img || '';
                const promptText = item.originalPrompt || item.prompt || 'Generated Artwork';
                const displayPrompt = escapeHtml(promptText);
                const ratio = item.ratio || item.aspectRatio || '1:1';
                const modelName = item.modelName || item.model || 'AI';

                card.innerHTML = \`
                    <div class="relative w-full h-full aspect-square bg-slate-100 dark:bg-[#1f1f1f] overflow-hidden rounded-2xl">
                        <img src="\${escapeHtml(imgUrl)}" alt="\${displayPrompt}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
                        
                        <!-- Smooth Subtle Dark Gradient Hover Overlay (Revealed ONLY on mouse hover) -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20 pointer-events-none group-hover:pointer-events-auto">
                            <!-- Top Corners Glassmorphism Badges (Shown ONLY on Hover) -->
                            <div class="flex items-center justify-between w-full pointer-events-none">
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/40 backdrop-blur-md text-white/95 border border-white/10 shadow-xs">\${ratio}</span>
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/40 backdrop-blur-md text-white/90 border border-white/10 shadow-xs max-w-[130px] truncate">\${escapeHtml(modelName)}</span>
                            </div>

                            <!-- Bottom Floating Prompt Preview & Quick Action Buttons -->
                            <div class="flex flex-col gap-2">
                                <p class="text-xs text-white line-clamp-2 font-normal drop-shadow-xs leading-snug">\${displayPrompt}</p>
                                
                                <!-- 3 Quick Action Buttons -->
                                <div class="flex items-center gap-1.5 pt-1.5 border-t border-white/15">
                                    <!-- 1. Edit with Smart Edit -->
                                    <button type="button" class="btn-home-card-edit flex-1 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-blue-600 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center gap-1 cursor-pointer" title="Edit with Smart Edit">
                                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
                                            <path d="m14 7 3 3"/>
                                        </svg>
                                        <span>Edit</span>
                                    </button>
                                    <!-- 2. Download Image -->
                                    <button type="button" class="btn-home-card-download p-1.5 rounded-lg bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center cursor-pointer" title="Download image">
                                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                    </button>
                                    <!-- 3. Copy Prompt -->
                                    <button type="button" class="btn-home-card-copy p-1.5 rounded-lg bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center cursor-pointer" title="Copy prompt">
                                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                const editBtn = card.querySelector('.btn-home-card-edit');
                const dlBtn = card.querySelector('.btn-home-card-download');
                const copyBtn = card.querySelector('.btn-home-card-copy');

                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        setImageStudioMode('workspace', { editItem: item });
                    });
                }
                if (dlBtn) {
                    dlBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const dlName = (promptText.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_') || 'image') + '.jpg';
                        triggerSilentImageDownload(imgUrl, dlName);
                    });
                }
                if (copyBtn) {
                    copyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(promptText).then(() => {
                            showStudioToast('Prompt copied to clipboard!');
                        }).catch(() => {
                            showStudioToast('Failed to copy prompt');
                        });
                    });
                }

                // Card body click loads prompt into composer
                card.addEventListener('click', (e) => {
                    if (e.target.closest('button')) return;
                    const homeInput = document.getElementById('image-home-prompt-input');
                    if (homeInput) {
                        homeInput.value = promptText;
                        homeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        homeInput.focus();
                        const homeView = document.getElementById('image-home-view');
                        if (homeView) homeView.scrollTo({ top: 0, behavior: 'smooth' });
                        showStudioToast('Loaded prompt into composer');
                    }
                });

                grid.appendChild(card);
            });
        }

        function renderImageHomeTemplates() {
            const grid = document.getElementById('image-home-templates-grid');
            if (!grid) return;

            grid.innerHTML = '';
            const templates = Array.isArray(STUDIO_INSPIRATIONS) ? STUDIO_INSPIRATIONS : [];

            templates.forEach((tmpl) => {
                const card = document.createElement('div');
                card.className = "group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-[#1f1f1f] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer select-none";

                const title = tmpl.title || 'Aesthetic Style';
                const displayTitle = escapeHtml(title);
                const tag = tmpl.tag || 'Style';
                const displayTag = escapeHtml(tag);
                const promptText = tmpl.prompt || '';
                const displayPrompt = escapeHtml(promptText);
                const imgUrl = tmpl.img || '';
                const ratio = tmpl.ratio || '1:1';

                card.innerHTML = \`
                    <div class="relative w-full h-full aspect-square bg-slate-100 dark:bg-[#1f1f1f] overflow-hidden rounded-2xl">
                        <img src="\${escapeHtml(imgUrl)}" alt="\${displayTitle}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">
                        
                        <!-- Smooth Subtle Dark Gradient Hover Overlay (Revealed ONLY on mouse hover) -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20 pointer-events-none group-hover:pointer-events-auto">
                            <!-- Top Corners Glassmorphism Badges (Shown ONLY on Hover) -->
                            <div class="flex items-center justify-between w-full pointer-events-none">
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/40 backdrop-blur-md text-white/95 border border-white/10 shadow-xs">\${displayTag}</span>
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/40 backdrop-blur-md text-white/90 border border-white/10 shadow-xs">\${ratio}</span>
                            </div>

                            <!-- Bottom Floating Prompt Preview & Quick Action Buttons -->
                            <div class="flex flex-col gap-2">
                                <div>
                                    <div class="text-xs font-semibold text-white drop-shadow-xs mb-0.5">\${displayTitle}</div>
                                    <p class="text-[11px] text-slate-200 line-clamp-2 font-normal drop-shadow-xs leading-snug">\${displayPrompt}</p>
                                </div>
                                
                                <!-- 3 Quick Action Buttons -->
                                <div class="flex items-center gap-1.5 pt-1.5 border-t border-white/15">
                                    <!-- 1. Edit with Smart Edit -->
                                    <button type="button" class="btn-tmpl-card-edit flex-1 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-blue-600 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center gap-1 cursor-pointer" title="Edit with Smart Edit">
                                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
                                            <path d="m14 7 3 3"/>
                                        </svg>
                                        <span>Edit</span>
                                    </button>
                                    <!-- 2. Download Image -->
                                    <button type="button" class="btn-tmpl-card-download p-1.5 rounded-lg bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center cursor-pointer" title="Download image">
                                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                    </button>
                                    <!-- 3. Copy Prompt -->
                                    <button type="button" class="btn-tmpl-card-copy p-1.5 rounded-lg bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center cursor-pointer" title="Copy prompt">
                                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                const editBtn = card.querySelector('.btn-tmpl-card-edit');
                const dlBtn = card.querySelector('.btn-tmpl-card-download');
                const copyBtn = card.querySelector('.btn-tmpl-card-copy');

                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const editItem = {
                            url: imgUrl,
                            img: imgUrl,
                            title: title,
                            originalPrompt: promptText,
                            prompt: promptText,
                            model: tmpl.model,
                            aspectRatio: ratio
                        };
                        setImageStudioMode('workspace', { editItem });
                    });
                }
                if (dlBtn) {
                    dlBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const dlName = (title.slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_') || 'template') + '.jpg';
                        triggerSilentImageDownload(imgUrl, dlName);
                    });
                }
                if (copyBtn) {
                    copyBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(promptText).then(() => {
                            showStudioToast('Template prompt copied!');
                        }).catch(() => {
                            showStudioToast('Failed to copy prompt');
                        });
                    });
                }

                // Card body click loads prompt into composer
                card.addEventListener('click', (e) => {
                    if (e.target.closest('button')) return;
                    const homeInput = document.getElementById('image-home-prompt-input');
                    if (homeInput) {
                        homeInput.value = promptText;
                        homeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        homeInput.focus();
                        const homeView = document.getElementById('image-home-view');
                        if (homeView) homeView.scrollTo({ top: 0, behavior: 'smooth' });
                        showStudioToast(\`Loaded "\${title}" prompt\`);
                    }
                });

                grid.appendChild(card);
            });
        }

        `;

html = html.slice(0, creationsStart) + newFunctionsJs + html.slice(modeStart);
console.log('✓ Replaced renderImageHomeCreations and renderImageHomeTemplates');

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Successfully wrote updated index.html');

