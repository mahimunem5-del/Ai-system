const fs = require('fs');

const path = 'index.html';
let content = fs.readFileSync(path, 'utf8');
const isCRLF = content.includes('\r\n');
let lines = content.split(/\r?\n/);

console.log('Total lines:', lines.length);

// ── 1. Update Left Panel Header ──────────────────────────────────────
const headerStart = lines.findIndex(l => l.includes('id="ideogram-left-panel"'));
const resetBtnIdx = lines.findIndex((l, idx) => idx > headerStart && l.includes('id="ideogram-reset-composer-btn"'));

if (headerStart === -1 || resetBtnIdx === -1) {
  console.error('Header boundaries not found!');
  process.exit(1);
}

// Find the opening breadcrumb div before reset button
let breadcrumbStart = -1;
for (let i = resetBtnIdx - 1; i >= headerStart; i--) {
  if (lines[i].includes('class="flex items-center gap-1.5 text-xs sm:text-sm font-medium')) {
    breadcrumbStart = i;
    break;
  }
}

if (breadcrumbStart === -1) {
  console.error('Breadcrumb start not found!');
  process.exit(1);
}

// Find closing tag of breadcrumb div
let breadcrumbEnd = -1;
for (let i = breadcrumbStart + 1; i < resetBtnIdx; i++) {
  if (lines[i].trim() === '</div>' && lines[i-1].includes('</svg>')) {
    breadcrumbEnd = i;
    break;
  }
}

if (breadcrumbEnd === -1) {
  console.error('Breadcrumb end not found!');
  process.exit(1);
}

console.log(`Replacing breadcrumb lines ${breadcrumbStart} to ${breadcrumbEnd}`);

const newHeaderLines = [
  '                    <!-- Standard Generate Mode Breadcrumb -->',
  '                    <div id="ideogram-header-generate" class="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">',
  '                        <span>Apps</span>',
  '                        <span class="text-slate-300 dark:text-white/20">/</span>',
  '                        <div class="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">',
  '                            <span>Generate Image</span>',
  '                            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                <path d="m6 9 6 6 6-6"/>',
  '                            </svg>',
  '                        </div>',
  '                    </div>',
  '                    <!-- Precise Edit Mode Breadcrumb -->',
  '                    <div id="ideogram-header-edit" class="hidden items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">',
  '                        <span>Apps</span>',
  '                        <span class="text-slate-300 dark:text-white/20">/</span>',
  '                        <div class="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">',
  '                            <span>Precise Edit</span>',
  '                        </div>',
  '                    </div>'
];

lines.splice(breadcrumbStart, breadcrumbEnd - breadcrumbStart + 1, ...newHeaderLines);

// ── 2. Wrap Generate Controls & Add Precise Edit Controls ─────────────
const scrollStart = lines.findIndex(l => l.includes('class="flex-1 overflow-y-auto p-4 space-y-4 ideogram-custom-scroll"'));
if (scrollStart === -1) {
  console.error('Scroll start not found!');
  process.exit(1);
}

// Replace scrollStart with non-spaced outer wrapper
lines[scrollStart] = '                <!-- Left Panel Scrollable Content -->\n                <div class="flex-1 overflow-y-auto p-4 ideogram-custom-scroll">\n                    <!-- GENERATE CONTROLS -->\n                    <div id="ideogram-generate-controls" class="space-y-4">';

// Find the end of count grid
const countGridEnd = lines.findIndex(l => l.includes('id="ideogram-count-grid"'));
let closeDivIdx = -1;
for (let i = countGridEnd + 1; i < countGridEnd + 20; i++) {
  if (lines[i].includes('</div>') && lines[i+1].includes('</aside>')) {
    closeDivIdx = i;
    break;
  }
}

if (closeDivIdx === -1) {
  console.error('Close div for scrollable content not found!');
  process.exit(1);
}

console.log(`Inserting Precise Edit controls before line ${closeDivIdx}`);

const preciseEditControls = [
  '                    </div>',
  '',
  '                    <!-- PRECISE EDIT CONTROLS (IDEOGRAM STYLE) -->',
  '                    <div id="ideogram-precise-edit-controls" class="hidden space-y-4">',
  '                        <!-- 1. SOURCE IMAGE CARD -->',
  '                        <div class="space-y-1.5">',
  '                            <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Source image</label>',
  '                            <div class="relative rounded-2xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50/70 dark:bg-white/[0.02] flex items-start gap-3">',
  '                                <div class="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">',
  '                                    <img id="studio-precise-edit-thumb" src="" alt="Source image" class="w-full h-full object-cover">',
  '                                </div>',
  '                                <div class="flex-1 min-w-0 flex flex-col justify-between h-20 py-0.5">',
  '                                    <div class="flex items-center justify-between">',
  '                                        <span id="studio-precise-edit-source-title" class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">Original Image</span>',
  '                                        <button type="button" id="studio-precise-edit-remove-src-btn"',
  '                                            class="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"',
  '                                            title="Remove source image">',
  '                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                                <path d="M18 6 6 18M6 6l12 12"/>',
  '                                            </svg>',
  '                                        </button>',
  '                                    </div>',
  '                                    <!-- Mask & context window placeholder button -->',
  '                                    <button type="button" id="studio-precise-edit-mask-btn"',
  '                                        class="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-2xs">',
  '                                        <svg class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                            <circle cx="12" cy="12" r="9"/>',
  '                                            <path d="M12 3v18"/>',
  '                                            <path d="M12 12 5.6 5.6"/>',
  '                                            <path d="M12 12l6.4 6.4"/>',
  '                                        </svg>',
  '                                        <span>Mask & context window</span>',
  '                                    </button>',
  '                                </div>',
  '                            </div>',
  '                        </div>',
  '',
  '                        <!-- 2. EDIT PROMPT BOX -->',
  '                        <div class="space-y-1.5">',
  '                            <label for="studio-precise-edit-input" class="text-xs font-semibold text-slate-700 dark:text-slate-300 block">What should change?</label>',
  '                            <div class="w-full bg-white dark:bg-[#161f2b] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs p-3 relative transition-all focus-within:border-slate-400 dark:focus-within:border-white/20 focus-within:ring-1 focus-within:ring-blue-500/20">',
  '                                <textarea id="studio-precise-edit-input" rows="4"',
  '                                    placeholder="Describe the change you want..."',
  '                                    class="w-full min-h-[110px] resize-none border-none outline-none focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[13.5px] bg-transparent leading-relaxed"></textarea>',
  '                            </div>',
  '                            <div id="studio-precise-edit-error"',
  '                                class="hidden items-center gap-1.5 text-xs text-rose-500 font-medium py-1">',
  '                                <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                    <circle cx="12" cy="12" r="10" />',
  '                                    <line x1="12" y1="8" x2="12" y2="12" />',
  '                                    <line x1="12" y1="16" x2="12.01" y2="16" />',
  '                                </svg>',
  '                                <span>Please describe the change you want.</span>',
  '                            </div>',
  '                        </div>',
  '',
  '                        <!-- 3. REFERENCE SLOTS -->',
  '                        <div id="studio-precise-edit-ref-section" class="space-y-1.5">',
  '                            <div class="flex items-center justify-between text-xs">',
  '                                <label class="font-semibold text-slate-700 dark:text-slate-300 text-xs">Reference images</label>',
  '                                <span id="studio-precise-edit-ref-status" class="text-[11px] text-slate-400 font-mono">0/10</span>',
  '                            </div>',
  '                            <div id="studio-precise-edit-ref-slots" class="flex items-center gap-2 flex-wrap">',
  '                                <div id="studio-precise-edit-ref-dropzone"',
  '                                    class="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all cursor-pointer group shrink-0"',
  '                                    title="Upload reference image">',
  '                                    <svg class="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                        <path d="M12 5v14m-7-7h14"/>',
  '                                    </svg>',
  '                                </div>',
  '                                <div class="w-14 h-14 rounded-xl border border-dashed border-slate-200 dark:border-white/5 bg-transparent shrink-0"></div>',
  '                            </div>',
  '                            <input type="file" id="studio-precise-edit-ref-input" accept="image/*" class="hidden">',
  '                        </div>',
  '',
  '                        <!-- 4. EDIT WEIGHT & VARIATIONS DROPDOWN ROW -->',
  '                        <div class="grid grid-cols-2 gap-2">',
  '                            <!-- Edit weight dropdown -->',
  '                            <div class="relative" id="studio-precise-weight-wrapper">',
  '                                <label class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Edit weight</label>',
  '                                <button id="studio-precise-edit-weight-btn" type="button"',
  '                                    class="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs">',
  '                                    <span id="studio-precise-edit-weight-label" class="font-medium truncate">Medium</span>',
  '                                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                        <path d="m6 9 6 6 6-6"/>',
  '                                    </svg>',
  '                                </button>',
  '',
  '                                <div id="studio-precise-edit-weight-dropdown"',
  '                                    class="hidden absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll">',
  '                                    <div class="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">Edit Weight</div>',
  '                                    <div class="space-y-0.5">',
  '                                        <button type="button" data-weight="Very low" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <span>Very low</span>',
  '                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                        <button type="button" data-weight="Low" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <span>Low</span>',
  '                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                        <button type="button" data-weight="Medium" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <span class="font-semibold text-slate-800 dark:text-slate-100">Medium</span>',
  '                                            <svg class="studio-precise-weight-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                        <button type="button" data-weight="High" class="studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <span>High</span>',
  '                                            <svg class="studio-precise-weight-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                    </div>',
  '                                </div>',
  '                            </div>',
  '',
  '                            <!-- Variations dropdown (1-4) -->',
  '                            <div class="relative" id="studio-precise-count-wrapper">',
  '                                <label class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Variations</label>',
  '                                <button id="studio-precise-edit-count-btn" type="button"',
  '                                    class="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs">',
  '                                    <div class="flex items-center gap-1.5 min-w-0">',
  '                                        <span id="studio-precise-edit-count-label" class="font-medium truncate">1 (1 image)</span>',
  '                                    </div>',
  '                                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                        <path d="m6 9 6 6 6-6"/>',
  '                                    </svg>',
  '                                </button>',
  '',
  '                                <div id="studio-precise-edit-count-dropdown"',
  '                                    class="hidden absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll">',
  '                                    <div class="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">Variations</div>',
  '                                    <div class="space-y-0.5">',
  '                                        <button type="button" data-count="1" data-label="1 (1 image)" class="studio-precise-count-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100/70 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <div class="flex items-center gap-1.5">',
  '                                                <span class="font-semibold text-slate-800 dark:text-slate-100">1</span>',
  '                                                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-normal">(1 image)</span>',
  '                                            </div>',
  '                                            <svg class="studio-precise-count-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                        <button type="button" data-count="2" data-label="2 (2 images)" class="studio-precise-count-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <div class="flex items-center gap-1.5">',
  '                                                <span>2</span>',
  '                                                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-normal">(2 images)</span>',
  '                                            </div>',
  '                                            <svg class="studio-precise-count-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                        <button type="button" data-count="3" data-label="3 (3 images)" class="studio-precise-count-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <div class="flex items-center gap-1.5">',
  '                                                <span>3</span>',
  '                                                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-normal">(3 images)</span>',
  '                                            </div>',
  '                                            <svg class="studio-precise-count-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                        <button type="button" data-count="4" data-label="4 (4 images)" class="studio-precise-count-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group">',
  '                                            <div class="flex items-center gap-1.5">',
  '                                                <span>4</span>',
  '                                                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-normal">(4 images)</span>',
  '                                            </div>',
  '                                            <svg class="studio-precise-count-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  '                                        </button>',
  '                                    </div>',
  '                                </div>',
  '                            </div>',
  '                        </div>',
  '',
  '                        <!-- 5. APPLY EDIT PRIMARY BUTTON -->',
  '                        <div class="pt-2">',
  '                            <button id="studio-apply-precise-edit-btn" type="button"',
  '                                class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">',
  '                                <svg id="studio-apply-precise-edit-icon" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
  '                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />',
  '                                    <path d="m15 5 4 4" />',
  '                                </svg>',
  '                                <span id="studio-apply-precise-edit-spinner" class="hidden">',
  '                                    <svg class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">',
  '                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>',
  '                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>',
  '                                    </svg>',
  '                                </span>',
  '                                <span id="studio-apply-precise-edit-text">Apply edit</span>',
  '                            </button>',
  '                        </div>',
  '                    </div>'
];

lines.splice(closeDivIdx, 0, ...preciseEditControls);

fs.writeFileSync(path, lines.join(isCRLF ? '\r\n' : '\n'), 'utf8');
console.log('Markup updated successfully!');

