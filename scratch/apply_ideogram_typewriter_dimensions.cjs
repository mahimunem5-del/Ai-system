const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Update Hero Section max-width to max-w-3xl sm:max-w-[760px]
const oldHeroWrapper = '<div class="w-full max-w-[720px] mx-auto flex flex-col items-center">';
const newHeroWrapper = '<div class="w-full max-w-3xl sm:max-w-[760px] mx-auto flex flex-col items-center">';

if (!html.includes(oldHeroWrapper)) {
  throw new Error('oldHeroWrapper target not found');
}
html = html.replace(oldHeroWrapper, newHeroWrapper);
console.log('✓ Updated hero section wrapper to max-w-3xl sm:max-w-[760px]');

// 2. Update Prompt Box container to rounded-3xl and min-h-[195px] sm:min-h-[205px]
const oldBoxClass = 'class="w-full bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[185px] sm:min-h-[195px]"';
const newBoxClass = 'class="w-full bg-white dark:bg-[#202020] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[195px] sm:min-h-[205px]"';

if (!html.includes(oldBoxClass)) {
  throw new Error('oldBoxClass target not found');
}
html = html.replace(oldBoxClass, newBoxClass);
console.log('✓ Updated prompt box dimensions to rounded-3xl & min-h-[195px] sm:min-h-[205px]');

// 3. Update Input Wrapper & Layering
const oldInputWrapper = `                        <!-- Center: Textarea with Vertically Balanced Dynamic Rotating Placeholder & Inline [Tab] Badge -->
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
                        </div>`;

const newInputWrapper = `                        <!-- Center: Textarea with Synchronized Overlay Stack & Word-by-Word Typewriter Placeholder -->
                        <div class="relative flex-1 w-full min-h-[64px] cursor-text" id="image-home-input-wrapper">
                            <!-- 1. Rotating Typewriter Placeholder Layer (Directly underneath with exact identical CSS) -->
                            <div id="image-home-placeholder-overlay"
                                class="absolute inset-0 pointer-events-none select-none text-sm sm:text-[15px] text-slate-400 dark:text-neutral-500 font-normal leading-relaxed m-0 p-0 transition-opacity duration-200 z-0">
                                <span id="image-home-placeholder-text"></span><span id="image-home-tab-badge" class="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider opacity-0 transition-opacity duration-300 align-baseline">Tab</span>
                            </div>

                            <!-- 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) -->
                            <textarea id="image-home-prompt-input" rows="3"
                                class="w-full h-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed font-normal relative z-10 block"
                                spellcheck="false"></textarea>
                        </div>`;

if (!html.includes(oldInputWrapper)) {
  throw new Error('oldInputWrapper target not found');
}
html = html.replace(oldInputWrapper, newInputWrapper);
console.log('✓ Updated input and placeholder synchronized overlay stack');

// 4. Update Typewriter Streaming JavaScript
const jsTargetStart = html.indexOf('const IDEOGRAM_ROTATING_PLACEHOLDERS = [');
const jsTargetEnd = html.indexOf('function initImageHomeView()', jsTargetStart);

if (jsTargetStart === -1 || jsTargetEnd === -1) {
  throw new Error('Could not find placeholder functions in index.html');
}

const newTypewriterJs = `const IDEOGRAM_ROTATING_PLACEHOLDERS = [
            "An origami crane made of world-map paper, clean studio lighting.",
            "A cartoon mascot of a hot chili pepper wearing a chef hat.",
            "Packaging for organic granola in kraft paper box with botanical illustration.",
            "A 35mm film photo of friends laughing around a campfire at dusk.",
            "A simple infographic showing the water cycle with labeled arrows.",
            "Retro-futuristic sci-fi cityscape with floating monorails, sunset glow.",
            "A cozy ceramic mug of matcha latte with delicate leaf foam art.",
            "Minimalist line-art poster of a Bauhaus architectural chair."
        ];

        let currentPlaceholderIndex = 0;
        let placeholderTypewriterTimer = null;
        let placeholderHoldTimer = null;
        let isStreamingWords = false;

        function stopTypewriterStreaming() {
            if (placeholderTypewriterTimer) {
                clearTimeout(placeholderTypewriterTimer);
                placeholderTypewriterTimer = null;
            }
            if (placeholderHoldTimer) {
                clearTimeout(placeholderHoldTimer);
                placeholderHoldTimer = null;
            }
            isStreamingWords = false;
        }

        function streamCurrentPrompt() {
            stopTypewriterStreaming();
            const homePrompt = document.getElementById('image-home-prompt-input');
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const placeholderEl = document.getElementById('image-home-placeholder-text');
            const tabBadge = document.getElementById('image-home-tab-badge');

            if (!placeholderEl || !overlay) return;
            if (homePrompt && homePrompt.value.trim().length > 0) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                return;
            }

            // Ensure overlay is visible with fresh opacity
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.style.opacity = '1';
            if (tabBadge) {
                tabBadge.classList.add('opacity-0');
                tabBadge.style.opacity = '0';
            }

            const phrase = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex] || '';
            const words = phrase.split(' ');
            let wordIdx = 0;
            placeholderEl.textContent = '';
            isStreamingWords = true;

            function streamNextWord() {
                if (!isStreamingWords) return;
                if (homePrompt && homePrompt.value.trim().length > 0) {
                    stopTypewriterStreaming();
                    overlay.classList.add('opacity-0', 'pointer-events-none');
                    return;
                }

                if (wordIdx < words.length) {
                    wordIdx++;
                    placeholderEl.textContent = words.slice(0, wordIdx).join(' ');
                    // Rapid, smooth word-by-word cadence (48ms)
                    placeholderTypewriterTimer = setTimeout(streamNextWord, 48);
                } else {
                    // All words streamed: reveal [TAB] badge at phrase end
                    isStreamingWords = false;
                    if (tabBadge) {
                        tabBadge.classList.remove('opacity-0');
                        tabBadge.style.opacity = '1';
                    }

                    // Hold for ~4 seconds before cleanly fading out
                    placeholderHoldTimer = setTimeout(() => {
                        if (homePrompt && homePrompt.value.trim().length > 0) return;
                        
                        // Clean fade out (250ms)
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            if (homePrompt && homePrompt.value.trim().length > 0) return;
                            currentPlaceholderIndex = (currentPlaceholderIndex + 1) % IDEOGRAM_ROTATING_PLACEHOLDERS.length;
                            streamCurrentPrompt();
                        }, 260);
                    }, 4000);
                }
            }

            streamNextWord();
        }

        function startPlaceholderRotation() {
            streamCurrentPrompt();
        }

        function stopPlaceholderRotation() {
            stopTypewriterStreaming();
        }

        `;

html = html.slice(0, jsTargetStart) + newTypewriterJs + html.slice(jsTargetEnd);
console.log('✓ Replaced rotating placeholder with word-by-word typewriter streaming animation');

// 5. Update syncSubmitButtonState inside initImageHomeView to use opacity-0 on placeholder overlay
const oldSyncSubmit = `            function syncSubmitButtonState() {
                if (!homePrompt || !homeSubmit) return;
                const hasText = homePrompt.value.trim().length > 0;
                homeSubmit.disabled = !hasText;
                if (hasText) {
                    homeSubmit.className = "w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 hover:opacity-90";
                    if (placeholderOverlay) placeholderOverlay.classList.add('hidden');
                } else {
                    homeSubmit.className = "w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-xs";
                    if (placeholderOverlay) placeholderOverlay.classList.remove('hidden');
                }
            }`;

const newSyncSubmit = `            function syncSubmitButtonState() {
                if (!homePrompt || !homeSubmit) return;
                const hasText = homePrompt.value.trim().length > 0;
                homeSubmit.disabled = !hasText;
                if (hasText) {
                    homeSubmit.className = "w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 hover:opacity-90";
                    if (placeholderOverlay) {
                        placeholderOverlay.classList.add('opacity-0', 'pointer-events-none');
                        stopTypewriterStreaming();
                    }
                } else {
                    homeSubmit.className = "w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-xs";
                    if (placeholderOverlay) {
                        placeholderOverlay.classList.remove('opacity-0', 'pointer-events-none');
                        if (!isStreamingWords && !placeholderHoldTimer) {
                            streamCurrentPrompt();
                        }
                    }
                }
            }`;

if (html.includes(oldSyncSubmit)) {
  html = html.replace(oldSyncSubmit, newSyncSubmit);
  console.log('✓ Updated syncSubmitButtonState');
} else {
  console.log('oldSyncSubmit not matched exactly, checking...');
}

// 6. Ensure input focus / click triggers
const oldInputClickTarget = `            if (placeholderOverlay) {
                placeholderOverlay.addEventListener('click', () => {
                    if (homePrompt) {
                        homePrompt.value = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex];
                        syncSubmitButtonState();
                        homePrompt.focus();
                    }
                });
            }`;

const newInputClick = `            const inputWrapper = document.getElementById('image-home-input-wrapper');
            if (inputWrapper) {
                inputWrapper.addEventListener('click', () => {
                    if (homePrompt) homePrompt.focus();
                });
            }
            if (placeholderOverlay) {
                placeholderOverlay.addEventListener('click', () => {
                    if (homePrompt) {
                        homePrompt.focus();
                    }
                });
            }`;

if (html.includes(oldInputClickTarget)) {
  html = html.replace(oldInputClickTarget, newInputClick);
  console.log('✓ Updated input wrapper click handlers');
}

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Successfully wrote index.html');

