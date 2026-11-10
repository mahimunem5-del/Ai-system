const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Add CSS Animations for Reference Shimmer & Prompt Slide-In in <head>
const cssTarget = '</style>\n</head>';
const newCss = `        /* Ideogram Primary Reference Slot Shimmer Pulse */
        @keyframes ideogramRefShimmer {
            0%, 100% {
                border-color: rgba(226, 232, 240, 0.6);
                box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            }
            50% {
                border-color: rgba(59, 130, 246, 0.5);
                box-shadow: 0 0 14px 2px rgba(59, 130, 246, 0.16);
            }
        }
        @keyframes ideogramRefShimmerDark {
            0%, 100% {
                border-color: rgba(255, 255, 255, 0.08);
                box-shadow: 0 0 0 0 rgba(96, 165, 250, 0);
            }
            50% {
                border-color: rgba(96, 165, 250, 0.45);
                box-shadow: 0 0 14px 2px rgba(96, 165, 250, 0.18);
            }
        }
        #image-home-ref-slot.animate-ref-shimmer {
            animation: ideogramRefShimmer 3.5s ease-in-out infinite;
        }
        .dark #image-home-ref-slot.animate-ref-shimmer,
        html.dark #image-home-ref-slot.animate-ref-shimmer {
            animation: ideogramRefShimmerDark 3.5s ease-in-out infinite;
        }

        /* Directional Slide-in & Fade for Rotating Prompts */
        @keyframes ideogramPromptSlideIn {
            from {
                opacity: 0;
                transform: translateX(-16px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes ideogramPromptSlideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(12px);
            }
        }
        .ideogram-prompt-enter {
            animation: ideogramPromptSlideIn 380ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .ideogram-prompt-exit {
            animation: ideogramPromptSlideOut 240ms cubic-bezier(0.4, 0, 1, 1) forwards !important;
        }
    </style>
</head>`;

if (!html.includes('animate-ref-shimmer')) {
  if (html.includes(cssTarget)) {
    html = html.replace(cssTarget, newCss);
    console.log('✓ Added Shimmer & Directional Slide CSS');
  } else {
    throw new Error('CSS target </style>\\n</head> not found');
  }
} else {
  console.log('Shimmer CSS already present');
}

// 2. Update Prompt Box HTML Markup
const promptBoxStart = html.indexOf('<!-- Pure Ideogram-Style Center Prompt Box -->');
const promptBoxEnd = html.indexOf('<!-- Recent Creations Section -->', promptBoxStart);

if (promptBoxStart === -1 || promptBoxEnd === -1) {
  throw new Error('Could not find Prompt Box markup in index.html');
}

const oldPromptBox = html.slice(promptBoxStart, promptBoxEnd);

// Let's inspect oldPromptBox bounds
console.log('Old Prompt Box length:', oldPromptBox.length);

const newPromptBox = `<!-- Pure Ideogram-Style Center Prompt Box -->
                    <div class="w-full bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[185px] sm:min-h-[195px]">
                        
                        <!-- Top-Left: Reference Image Slots (Frosted Glass with Periodic Shimmer Glow) -->
                        <div class="flex items-center gap-2.5 mb-4">
                            <!-- Slot 1: Primary Upload Button (Frosted Glass & Shimmer Pulse) -->
                            <input type="file" id="image-home-file-input" accept="image/*" class="hidden">
                            <div id="image-home-ref-slot"
                                class="relative w-11 h-11 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-center cursor-pointer transition-all duration-300 group/ref overflow-hidden animate-ref-shimmer"
                                title="Add reference image">
                                <svg class="w-4 h-4 text-slate-400 dark:text-neutral-400 group-hover/ref:text-slate-700 dark:group-hover/ref:text-white group-hover/ref:scale-110 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <!-- Preview Overlay when image is loaded -->
                                <div id="image-home-ref-preview" class="hidden absolute inset-0 rounded-2xl overflow-hidden bg-white dark:bg-[#202020] z-10">
                                    <img id="image-home-ref-thumb" src="" alt="Reference" class="w-full h-full object-cover">
                                    <button type="button" id="image-home-ref-remove" class="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] hover:bg-black transition-colors" title="Remove reference">✕</button>
                                </div>
                            </div>

                            <!-- Slot 2: Ghost Slot (Semi-transparent with delicate low-opacity border) -->
                            <div id="image-home-ghost-slot"
                                class="w-11 h-11 rounded-2xl bg-neutral-100/30 dark:bg-neutral-800/20 backdrop-blur-sm border border-dashed border-neutral-200/40 dark:border-neutral-700/30 flex items-center justify-center transition-all cursor-pointer opacity-60 hover:opacity-100"
                                title="Add reference image">
                                <svg class="w-3.5 h-3.5 text-slate-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>

                        <!-- Center: Textarea with Vertically Balanced Dynamic Rotating Placeholder & Inline [Tab] Badge -->
                        <div class="relative flex-1 w-full my-auto flex flex-col justify-center min-h-[58px] cursor-text" id="image-home-input-wrapper">
                            <textarea id="image-home-prompt-input" rows="2"
                                class="w-full bg-transparent resize-none border-0 p-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed relative z-10 font-normal my-auto"></textarea>
                            
                            <!-- Rotating Placeholder Overlay (Directional slide-in & fade) -->
                            <div id="image-home-placeholder-overlay"
                                class="absolute inset-0 pointer-events-none flex items-center text-sm sm:text-[15px] text-slate-400 dark:text-slate-500 leading-relaxed select-none z-0">
                                <div id="image-home-placeholder-content" class="flex items-center flex-wrap gap-2 w-full">
                                    <span id="image-home-placeholder-text" class="line-clamp-2">An origami crane made of world-map paper, clean studio lighting.</span>
                                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-400 shrink-0 select-none uppercase tracking-wider">Tab</span>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Row: Minimal Icon Tools & Circular ArrowUp Send Button -->
                        <div class="flex items-center justify-between pt-3 mt-auto">
                            <!-- Bottom-Left Minimal Icons (Ideogram style: Aspect Ratio & Model Selection) -->
                            <div class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                <!-- 1. Aspect Ratio Trigger & Popover -->
                                <div class="relative" id="image-home-ratio-wrapper">
                                    <button type="button" id="image-home-ratio-btn"
                                        class="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center group"
                                        title="Aspect Ratio: Auto (AI decides)">
                                        <span id="image-home-ratio-icon" class="w-4 h-4 flex items-center justify-center">
                                            <svg class="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                                <circle cx="9" cy="9" r="2"/>
                                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                            </svg>
                                        </span>
                                    </button>

                                    <!-- Aspect Ratio Popover (Clean Downward Floating Dropdown) -->
                                    <div id="image-home-ratio-popover"
                                        class="hidden absolute left-0 top-full mt-2 w-60 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll">
                                        <div class="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2.5 py-1.5 border-b border-slate-100 dark:border-white/10 mb-1">Aspect Ratio</div>
                                        <div class="space-y-0.5">
                                            <!-- 1. Auto (AI decides) - TOP & DEFAULT -->
                                            <button type="button" data-ratio="auto" data-label="Auto (AI decides)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 font-semibold text-slate-900 dark:text-white text-xs cursor-pointer transition-colors text-left group">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
                                                        </svg>
                                                    </div>
                                                    <span class="truncate">Auto (AI decides)</span>
                                                </div>
                                                <svg class="image-home-ratio-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 2. 1:1 (Square) -->
                                            <button type="button" data-ratio="1:1" data-label="1:1 (Square)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-3.5 h-3.5 border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">1:1 (Square)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 3. 2:3 (Portrait) -->
                                            <button type="button" data-ratio="2:3" data-label="2:3 (Portrait)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-[11px] h-[16px] border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">2:3 (Portrait)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 4. 3:4 (Portrait) -->
                                            <button type="button" data-ratio="3:4" data-label="3:4 (Portrait)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-[12px] h-[16px] border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">3:4 (Portrait)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 5. 9:16 (Mobile) -->
                                            <button type="button" data-ratio="9:16" data-label="9:16 (Mobile)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-[9px] h-[16px] border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">9:16 (Mobile)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 6. 3:2 (Landscape) -->
                                            <button type="button" data-ratio="3:2" data-label="3:2 (Landscape)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-[16px] h-[11px] border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">3:2 (Landscape)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 7. 4:3 (Landscape) -->
                                            <button type="button" data-ratio="4:3" data-label="4:3 (Landscape)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-[16px] h-[12px] border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">4:3 (Landscape)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                            <!-- 8. 16:9 (Widescreen) -->
                                            <button type="button" data-ratio="16:9" data-label="16:9 (Widescreen)"
                                                class="image-home-ratio-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium cursor-pointer transition-colors text-left group text-slate-700 dark:text-slate-300">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                                                        <div class="studio-ratio-wireframe w-[16px] h-[9px] border-1.5 border-[1.5px] border-current rounded-xs shrink-0"></div>
                                                    </div>
                                                    <span class="truncate">16:9 (Widescreen)</span>
                                                </div>
                                                <svg class="image-home-ratio-check hidden w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- 2. Model Selection Trigger & Popover -->
                                <div class="relative" id="image-home-model-wrapper">
                                    <button type="button" id="image-home-model-btn"
                                        class="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center group"
                                        title="Model: Auto">
                                        <span id="image-home-model-icon" class="w-4 h-4 flex items-center justify-center">
                                            <!-- Sleek AI Chip / Processor Icon (Lucide Cpu style) -->
                                            <svg class="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect width="14" height="14" x="5" y="5" rx="2"/>
                                                <path d="M9 9h6v6H9z"/>
                                                <path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4M19 9h4m-4 6h4"/>
                                            </svg>
                                        </span>
                                    </button>

                                    <!-- Model Selection Popover (Clean Downward Floating Dropdown) -->
                                    <div id="image-home-model-popover"
                                        class="hidden absolute left-0 top-full mt-2 w-72 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-72 overflow-y-auto ideogram-custom-scroll">
                                        <div class="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2.5 py-1.5 border-b border-slate-100 dark:border-white/10 mb-1">Generation Model</div>
                                        <div class="space-y-0.5">
                                            <!-- Auto Option -->
                                            <button type="button" data-model="auto" data-name="Auto"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-white/10 font-semibold text-slate-900 dark:text-white cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <rect width="14" height="14" x="5" y="5" rx="2"/>
                                                        <path d="M9 9h6v6H9z"/>
                                                        <path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4M19 9h4m-4 6h4"/>
                                                    </svg>
                                                    <span class="image-home-model-name text-xs font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white truncate">Auto</span>
                                                </div>
                                                <svg class="image-home-model-check w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <!-- 1. GPT Image 2.5 Sunburst -->
                                            <button type="button" data-model="openai/gpt-image-2.5-sunburst" data-name="GPT Image 2.5 Sunburst"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0 text-zinc-900 dark:text-white" viewBox="60 60 392 392" fill="currentColor">
                                                        <path fill-rule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
                                                    </svg>
                                                    <span class="image-home-model-name text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">GPT Image 2.5 Sunburst</span>
                                                </div>
                                                <svg class="image-home-model-check hidden w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <!-- 2. Nano Banana Pro (Gemini 3 Pro Image) -->
                                            <button type="button" data-model="google/gemini-3-pro-image" data-name="Nano Banana Pro (Gemini 3 Pro Image)"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><defs><linearGradient id="gemini-sparkle-home-pro" x1="85%" y1="15%" x2="15%" y2="85%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="50%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" style="fill:#2563EB;fill:url(#gemini-sparkle-home-pro);"/></svg>
                                                    <span class="image-home-model-name text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">Nano Banana Pro (Gemini 3 Pro Image)</span>
                                                </div>
                                                <svg class="image-home-model-check hidden w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <!-- 3. FLUX.2 Pro -->
                                            <button type="button" data-model="black-forest-labs/flux.2-pro" data-name="FLUX.2 Pro"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0 text-zinc-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.2l7.5 4.1L12 12.4 4.5 8.3 12 4.2zM4 9.8l7 3.8v7.6l-7-3.8V9.8zm16 7.6l-7 3.8v-7.6l7-3.8v7.6z"/>
                                                    </svg>
                                                    <span class="image-home-model-name text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">FLUX.2 Pro</span>
                                                </div>
                                                <svg class="image-home-model-check hidden w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <!-- 4. Seedream 5.0 Pro -->
                                            <button type="button" data-model="bytedance-seed/seedream-5.0-pro" data-name="Seedream 5.0 Pro"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                                                        <rect x="2.5" y="6" width="3.2" height="12" rx="1.6" fill="#3B82F6"/>
                                                        <rect x="7.8" y="3" width="3.2" height="18" rx="1.6" fill="#06B6D4"/>
                                                        <rect x="13.1" y="6" width="3.2" height="15" rx="1.6" fill="#3B82F6"/>
                                                        <rect x="18.4" y="8" width="3.2" height="10" rx="1.6" fill="#06B6D4"/>
                                                    </svg>
                                                    <span class="image-home-model-name text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">Seedream 5.0 Pro</span>
                                                </div>
                                                <svg class="image-home-model-check hidden w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <!-- 5. Meta: Muse Image -->
                                            <button type="button" data-model="meta/muse-image" data-name="Meta: Muse Image"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0081FB">
                                                        <path d="M16.995 3C14.636 3 12.748 4.316 12 5.864 11.252 4.316 9.364 3 7.005 3 3.136 3 0 6.136 0 10.005c0 3.869 3.136 7.005 7.005 7.005 2.359 0 4.247-1.316 4.995-2.864.748 1.548 2.636 2.864 4.995 2.864 3.869 0 7.005-3.136 7.005-7.005C24 6.136 20.864 3 16.995 3zm0 11.96c-1.898 0-3.568-1.074-4.39-2.73a.873.873 0 0 0-1.21 0c-.822 1.656-2.492 2.73-4.39 2.73-2.732 0-4.955-2.223-4.955-4.955s2.223-4.955 4.955-4.955c1.898 0 3.568 1.074 4.39 2.73a.873.873 0 0 0 1.21 0c.822-1.656 2.492-2.73 4.39-2.73 2.732 0 4.955 2.223 4.955 4.955s-2.223 4.955-4.955 4.955z"/>
                                                    </svg>
                                                    <span class="image-home-model-name text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">Meta: Muse Image</span>
                                                </div>
                                                <svg class="image-home-model-check hidden w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <!-- 6. Nano Banana 2 (Gemini 3.1 Flash Image) -->
                                            <button type="button" data-model="google/gemini-3.1-flash-image-preview" data-name="Nano Banana 2 (Gemini 3.1 Flash Image)"
                                                class="image-home-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><defs><linearGradient id="gemini-sparkle-home-flash" x1="85%" y1="15%" x2="15%" y2="85%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="50%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" style="fill:#2563EB;fill:url(#gemini-sparkle-home-flash);"/></svg>
                                                    <span class="image-home-model-name text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">Nano Banana 2 (Gemini 3.1 Flash Image)</span>
                                                </div>
                                                <svg class="image-home-model-check hidden w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom-Right Circular Send Button -->
                            <button type="button" id="image-home-submit-btn" disabled
                                class="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
                                title="Generate">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="19" x2="12" y2="5"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                            </button>
                        </div>

                    </div>
                </div>

                `;

html = html.slice(0, promptBoxStart) + newPromptBox + html.slice(promptBoxEnd);
console.log('✓ Updated Prompt Box HTML markup');

// 3. Update updatePlaceholderDisplay and startPlaceholderRotation in JS
const fnStart = html.indexOf('function updatePlaceholderDisplay(');
const fnEnd = html.indexOf('function initImageHomeView()', fnStart);

if (fnStart === -1 || fnEnd === -1) {
  throw new Error('Could not find placeholder JS functions in index.html');
}

const newPlaceholderJs = `function updatePlaceholderDisplay(isTransition = false) {
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const contentEl = document.getElementById('image-home-placeholder-content');
            const placeholderEl = document.getElementById('image-home-placeholder-text');
            const homePrompt = document.getElementById('image-home-prompt-input');
            if (!placeholderEl || !overlay) return;

            if (homePrompt && homePrompt.value.trim().length > 0) {
                overlay.classList.add('hidden');
                return;
            }
            overlay.classList.remove('hidden');

            const targetEl = contentEl || placeholderEl;
            if (!isTransition) {
                placeholderEl.textContent = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex];
                targetEl.classList.remove('ideogram-prompt-exit', 'ideogram-prompt-enter');
                return;
            }

            // Directional slide exit: fades out slightly forward (x: 12px, ~240ms)
            targetEl.classList.remove('ideogram-prompt-enter');
            targetEl.classList.add('ideogram-prompt-exit');

            setTimeout(() => {
                placeholderEl.textContent = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex];
                targetEl.classList.remove('ideogram-prompt-exit');
                // Directional slide enter: smoothly slides in from left to right (x: -16px to 0, ~380ms)
                targetEl.classList.add('ideogram-prompt-enter');
                setTimeout(() => {
                    targetEl.classList.remove('ideogram-prompt-enter');
                }, 400);
            }, 240);
        }

        function startPlaceholderRotation() {
            if (placeholderTimer) clearInterval(placeholderTimer);
            updatePlaceholderDisplay(false);
            placeholderTimer = setInterval(() => {
                const homePrompt = document.getElementById('image-home-prompt-input');
                if (homePrompt && homePrompt.value.trim().length > 0) return;
                currentPlaceholderIndex = (currentPlaceholderIndex + 1) % IDEOGRAM_ROTATING_PLACEHOLDERS.length;
                updatePlaceholderDisplay(true);
            }, 4500);
        }

        function stopPlaceholderRotation() {
            if (placeholderTimer) {
                clearInterval(placeholderTimer);
                placeholderTimer = null;
            }
        }

        `;

html = html.slice(0, fnStart) + newPlaceholderJs + html.slice(fnEnd);
console.log('✓ Updated updatePlaceholderDisplay and startPlaceholderRotation with directional slide transitions');

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Successfully wrote index.html');

