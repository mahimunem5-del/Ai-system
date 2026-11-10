const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Update Workspace Header to include Ideogram-Style Dropdown Tool Switcher
const oldHeader = `<div id="ideogram-header-generate" class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        <button type="button" id="ideogram-back-to-home-btn" class="p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1" title="Back to Image Home">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                        </button>
                        <span>Generate Image</span>
                    </div>`;

const newHeader = `<div id="ideogram-header-generate" class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white relative">
                        <button type="button" id="ideogram-back-to-home-btn" class="p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1" title="Back to Image Home">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                        </button>
                        
                        <!-- Ideogram-Style Breadcrumb App Switcher Dropdown -->
                        <div class="relative" id="workspace-tool-switcher-wrapper">
                            <button type="button" id="workspace-tool-switcher-btn" class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-2 py-1.5 rounded-lg transition cursor-pointer select-none">
                                <span class="text-neutral-400 dark:text-neutral-500 font-normal hidden sm:inline">Creative Workflows /</span>
                                <span id="workspace-active-tool-label">Generate Image</span>
                                <svg class="w-3.5 h-3.5 text-neutral-400 transition-transform duration-200" id="workspace-tool-switcher-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m6 9 6 6 6-6"/>
                                </svg>
                            </button>

                            <!-- Searchable Popup Menu (Flyout) -->
                            <div id="workspace-tool-flyout" class="hidden absolute left-0 top-full mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl p-1.5 z-50">
                                <!-- Header Search Input -->
                                <div class="relative mb-1.5 px-1 pt-1">
                                    <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/50 dark:border-neutral-700/50 text-xs">
                                        <svg class="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                                        </svg>
                                        <input type="text" id="workspace-tool-search-input" placeholder="Search workflows..." class="w-full bg-transparent border-0 p-0 text-xs text-slate-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-0">
                                    </div>
                                </div>

                                <!-- Menu List of 6 tools -->
                                <div id="workspace-tool-list" class="space-y-0.5 max-h-64 overflow-y-auto ideogram-custom-scroll">
                                    <!-- Populated dynamically via JavaScript -->
                                </div>
                            </div>
                        </div>
                    </div>`;

if (!html.includes(oldHeader)) {
  console.error('Could not find oldHeader in index.html');
  process.exit(1);
}
html = html.replace(oldHeader, newHeader);
console.log('✓ Replaced workspace header with Ideogram-style App Switcher Dropdown');

// 2. Add Vector Mode Banner inside ideogram-generate-controls
const oldGenControlsStart = `<div id="ideogram-generate-controls" class="space-y-4">`;
const newGenControlsStart = `<div id="ideogram-generate-controls" class="space-y-4">
                        <!-- Vector Mode Active Indicator Banner -->
                        <div id="vector-mode-banner" class="hidden items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 font-medium mb-3">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m12 19 7-7 3 3-7 7-3-3z"/>
                                    <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                                    <circle cx="11" cy="11" r="2"/>
                                </svg>
                                <div>
                                    <span class="font-semibold">Vector Illustration Mode</span>
                                    <p class="text-[10px] text-blue-600/80 dark:text-blue-300/70 font-normal">Auto-applies vector constraints & SVG styling</p>
                                </div>
                            </div>
                            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-xs">NEW</span>
                        </div>`;

if (!html.includes(oldGenControlsStart)) {
  console.error('Could not find oldGenControlsStart in index.html');
  process.exit(1);
}
html = html.replace(oldGenControlsStart, newGenControlsStart);
console.log('✓ Added Vector Mode banner inside ideogram-generate-controls');

// 3. Add Remove Background, Upscale, and Image to Image control panels right after ideogram-precise-edit-controls closes
const targetLoc = `                            </button>
                        </div>
                    </div>
        </div>
    </aside>`;

const replacementLoc = `                            </button>
                        </div>
                    </div>

                    <!-- REMOVE BACKGROUND CONTROLS (ZERO-COST INSTANT CUTOUT) -->
                    <div id="ideogram-remove-bg-controls" class="hidden space-y-4">
                        <div class="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                            </svg>
                            <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-normal">
                                <strong>Zero-Cost Cutout:</strong> Instant client-side transparent PNG generation. Does not spend any generative AI credits.
                            </p>
                        </div>

                        <!-- Dropzone / Image Slot -->
                        <input type="file" id="remove-bg-file-input" accept="image/*" class="hidden">
                        <div id="remove-bg-dropzone" class="relative w-full min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-700 bg-slate-50/60 dark:bg-neutral-800/20 hover:border-blue-500/70 dark:hover:border-blue-400/70 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group">
                            <!-- Empty state icon & text -->
                            <div id="remove-bg-empty-state" class="flex flex-col items-center">
                                <div class="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-slate-100 dark:border-neutral-700 flex items-center justify-center text-slate-400 dark:text-neutral-400 group-hover:text-blue-500 group-hover:scale-105 transition-all mb-3">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>
                                    </svg>
                                </div>
                                <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1">Upload source image</span>
                                <span class="text-[11px] text-slate-400 dark:text-neutral-500">Drag & drop or click to browse (PNG, JPG, WebP)</span>
                            </div>

                            <!-- Uploaded Preview -->
                            <div id="remove-bg-preview-wrap" class="hidden absolute inset-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-900 z-10">
                                <img id="remove-bg-preview-img" src="" alt="Source preview" class="w-full h-full object-contain">
                                <button type="button" id="remove-bg-remove-btn" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center text-xs transition cursor-pointer z-20" title="Remove image">✕</button>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <button type="button" id="btn-do-remove-bg" disabled class="w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/>
                            </svg>
                            <span id="btn-do-remove-bg-text">Remove Background</span>
                        </button>
                    </div>

                    <!-- UPSCALE IMAGE CONTROLS (SUPER-RESOLUTION PIPELINE) -->
                    <div id="ideogram-upscale-controls" class="hidden space-y-4">
                        <div class="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-900/15 border border-purple-100 dark:border-purple-900/30 flex items-start gap-2.5">
                            <svg class="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
                            </svg>
                            <p class="text-xs text-purple-700 dark:text-purple-300 leading-relaxed font-normal">
                                <strong>Super-Resolution:</strong> Enhances resolution, edge sharpness, and micro-details into high-DPI output.
                            </p>
                        </div>

                        <!-- Dropzone / Image Slot -->
                        <input type="file" id="upscale-file-input" accept="image/*" class="hidden">
                        <div id="upscale-dropzone" class="relative w-full min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-700 bg-slate-50/60 dark:bg-neutral-800/20 hover:border-purple-500/70 dark:hover:border-purple-400/70 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group">
                            <div id="upscale-empty-state" class="flex flex-col items-center">
                                <div class="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-slate-100 dark:border-neutral-700 flex items-center justify-center text-slate-400 dark:text-neutral-400 group-hover:text-purple-500 group-hover:scale-105 transition-all mb-3">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
                                    </svg>
                                </div>
                                <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 mb-1">Upload image to upscale</span>
                                <span class="text-[11px] text-slate-400 dark:text-neutral-500">Supports PNG, JPG, WebP</span>
                            </div>
                            <div id="upscale-preview-wrap" class="hidden absolute inset-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-900 z-10">
                                <img id="upscale-preview-img" src="" alt="Source preview" class="w-full h-full object-contain">
                                <button type="button" id="upscale-remove-btn" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center text-xs transition cursor-pointer z-20" title="Remove image">✕</button>
                            </div>
                        </div>

                        <!-- Scale Factor Selector -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-semibold text-slate-700 dark:text-neutral-300">Target Scale</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button type="button" data-upscale-factor="2" class="btn-upscale-factor py-2 px-3 rounded-xl border border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                                    <span>2x (High Quality)</span>
                                </button>
                                <button type="button" data-upscale-factor="4" class="btn-upscale-factor py-2 px-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-transparent text-slate-600 dark:text-neutral-400 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:border-slate-300 transition">
                                    <span>4x (Ultra HD)</span>
                                </button>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <button type="button" id="btn-do-upscale" disabled class="w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
                            </svg>
                            <span id="btn-do-upscale-text">Upscale Image</span>
                        </button>
                    </div>

                    <!-- IMAGE TO IMAGE CONTROLS (STYLE VARIATION & REMIX PIPELINE) -->
                    <div id="ideogram-img2img-controls" class="hidden space-y-4">
                        <!-- Source Reference Slot -->
                        <input type="file" id="img2img-file-input" accept="image/*" class="hidden">
                        <div id="img2img-dropzone" class="relative w-full h-[140px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-700 bg-slate-50/60 dark:bg-neutral-800/20 hover:border-blue-500/70 dark:hover:border-blue-400/70 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group">
                            <div id="img2img-empty-state" class="flex flex-col items-center">
                                <svg class="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-blue-500 mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
                                </svg>
                                <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200">Upload Base Image</span>
                                <span class="text-[10px] text-slate-400 dark:text-neutral-500">Source composition reference</span>
                            </div>
                            <div id="img2img-preview-wrap" class="hidden absolute inset-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-900 z-10">
                                <img id="img2img-preview-img" src="" alt="Source preview" class="w-full h-full object-contain">
                                <button type="button" id="img2img-remove-btn" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center text-xs transition cursor-pointer z-20" title="Remove image">✕</button>
                            </div>
                        </div>

                        <!-- Strength Slider -->
                        <div class="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/60 dark:border-neutral-700/60">
                            <div class="flex items-center justify-between text-xs font-medium">
                                <span class="text-slate-700 dark:text-neutral-300">Creativity / Strength</span>
                                <span id="img2img-strength-val" class="text-blue-600 dark:text-blue-400 font-mono font-semibold">0.65</span>
                            </div>
                            <input type="range" id="img2img-strength-slider" min="0.1" max="0.9" step="0.05" value="0.65" class="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600">
                            <div class="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500">
                                <span>Closer to source (0.1)</span>
                                <span>Creative variation (0.9)</span>
                            </div>
                        </div>

                        <!-- Prompt Input -->
                        <div class="space-y-1">
                            <label class="text-xs font-semibold text-slate-700 dark:text-neutral-300">Variation Prompt</label>
                            <textarea id="img2img-prompt-input" rows="3" placeholder="Describe the style or changes to apply to this image..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
                        </div>

                        <!-- Action Button -->
                        <button type="button" id="btn-do-img2img" disabled class="w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-500 cursor-not-allowed">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
                            </svg>
                            <span id="btn-do-img2img-text">Generate Variations</span>
                        </button>
                    </div>
        </div>
    </aside>`;

if (!html.includes(targetLoc)) {
  console.error('Could not find targetLoc in index.html');
  process.exit(1);
}
html = html.replace(targetLoc, replacementLoc);
console.log('✓ Added remove-bg, upscale, and img2img control panels to left panel');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully saved markup updates to index.html!');

