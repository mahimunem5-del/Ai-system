const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Update Hero Section max-width to max-w-[780px] w-full mx-auto
const oldHeroWrapper = '<div class="w-full max-w-3xl sm:max-w-[760px] mx-auto flex flex-col items-center">';
const newHeroWrapper = '<div class="w-full max-w-[780px] mx-auto flex flex-col items-center">';

if (!html.includes(oldHeroWrapper)) {
  throw new Error('oldHeroWrapper target not found');
}
html = html.replace(oldHeroWrapper, newHeroWrapper);
console.log('✓ Updated hero section wrapper to max-w-[780px] w-full mx-auto');

// 2. Update Prompt Box container to min-h-[220px], bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md, border-neutral-200/60 dark:border-neutral-800/60, p-5 sm:p-6
const oldBoxClass = 'class="w-full bg-white dark:bg-[#202020] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[195px] sm:min-h-[205px]"';
const newBoxClass = 'class="w-full bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-5 sm:p-6 transition-all duration-200 focus-within:border-neutral-300 dark:focus-within:border-neutral-700 relative z-10 flex flex-col justify-between min-h-[220px]"';

if (!html.includes(oldBoxClass)) {
  throw new Error('oldBoxClass target not found');
}
html = html.replace(oldBoxClass, newBoxClass);
console.log('✓ Updated prompt box dimensions to min-h-[220px], frosted glass backdrop & border-neutral-200/60');

// 3. Update 3-row layout inside Prompt Box:
// Row 1: shrink-0
// Row 2: relative flex-1 my-auto flex items-center w-full min-h-[68px] cursor-text
// Row 3: pt-2 mt-auto shrink-0
const oldRow1 = '<!-- Top-Left: Reference Image Slots (Frosted Glass with Periodic Shimmer Glow) -->\n                        <div class="flex items-center gap-2.5 mb-4">';
const newRow1 = '<!-- Row 1: Reference Image Slots (Top-Left) -->\n                        <div class="flex items-center gap-2.5 shrink-0">';

if (html.includes(oldRow1)) {
  html = html.replace(oldRow1, newRow1);
  console.log('✓ Updated Row 1 markup');
} else {
  console.log('oldRow1 not matched directly');
}

const oldRow2 = `                        <!-- Center: Textarea with Synchronized Overlay Stack & Word-by-Word Typewriter Placeholder -->
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

const newRow2 = `                        <!-- Row 2: Prompt Input Container (Middle - Centered with flexible growth) -->
                        <div class="relative flex-1 my-auto flex items-center w-full min-h-[68px] cursor-text" id="image-home-input-wrapper">
                            <!-- 1. Rotating Typewriter Placeholder Layer (Directly underneath with exact identical CSS & vertical alignment) -->
                            <div id="image-home-placeholder-overlay"
                                class="absolute inset-0 flex items-center pointer-events-none select-none text-sm sm:text-[15px] text-slate-400 dark:text-neutral-500 font-normal leading-relaxed m-0 p-0 transition-opacity duration-200 z-0">
                                <span id="image-home-placeholder-text"></span><span id="image-home-tab-badge" class="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider opacity-0 transition-opacity duration-300 align-baseline">Tab</span>
                            </div>

                            <!-- 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) -->
                            <textarea id="image-home-prompt-input" rows="2"
                                class="w-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed font-normal relative z-10 block"
                                spellcheck="false"></textarea>
                        </div>`;

if (!html.includes(oldRow2)) {
  throw new Error('oldRow2 target not found');
}
html = html.replace(oldRow2, newRow2);
console.log('✓ Updated Row 2 with flexible growth and exact middle centering');

const oldRow3 = '<!-- Bottom Row: Minimal Icon Tools & Circular ArrowUp Send Button -->\n                        <div class="flex items-center justify-between pt-3 mt-auto">';
const newRow3 = '<!-- Row 3: Bottom Bar (Aspect Ratio, Model Selection, Circular Send) -->\n                        <div class="flex items-center justify-between pt-2 mt-auto shrink-0">';

if (html.includes(oldRow3)) {
  html = html.replace(oldRow3, newRow3);
  console.log('✓ Updated Row 3 markup');
} else {
  console.log('oldRow3 not matched directly');
}

// 4. Update JavaScript Logic for Instant Hiding on Focus / Typing & Tab Copying
const oldJsRegionStart = html.indexOf('let currentPlaceholderIndex = 0;');
const oldJsRegionEnd = html.indexOf('function submitHomePrompt()', oldJsRegionStart);

if (oldJsRegionStart === -1 || oldJsRegionEnd === -1) {
  throw new Error('Could not find JS region in index.html');
}

const newJsRegion = `let currentPlaceholderIndex = 0;
        let placeholderTypewriterTimer = null;
        let placeholderHoldTimer = null;
        let isStreamingWords = false;
        let isHomePromptFocused = false;

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

        function updatePlaceholderVisibility() {
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const homePrompt = document.getElementById('image-home-prompt-input');
            if (!overlay || !homePrompt) return;

            const hasText = homePrompt.value.trim().length > 0;
            // Instant hiding on focus or typing:
            if (hasText || isHomePromptFocused || document.activeElement === homePrompt) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '0';
                stopTypewriterStreaming();
            } else {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '1';
                if (!isStreamingWords && !placeholderHoldTimer) {
                    streamCurrentPrompt();
                }
            }
        }

        function streamCurrentPrompt() {
            stopTypewriterStreaming();
            const homePrompt = document.getElementById('image-home-prompt-input');
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const placeholderEl = document.getElementById('image-home-placeholder-text');
            const tabBadge = document.getElementById('image-home-tab-badge');

            if (!placeholderEl || !overlay) return;

            // Only stream when input is completely empty AND blurred/idle
            const isFocused = isHomePromptFocused || document.activeElement === homePrompt;
            if ((homePrompt && homePrompt.value.trim().length > 0) || isFocused) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '0';
                return;
            }

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
                const isCurrentlyFocused = isHomePromptFocused || document.activeElement === homePrompt;
                if ((homePrompt && homePrompt.value.trim().length > 0) || isCurrentlyFocused) {
                    stopTypewriterStreaming();
                    overlay.classList.add('opacity-0', 'pointer-events-none');
                    overlay.style.opacity = '0';
                    return;
                }

                if (wordIdx < words.length) {
                    wordIdx++;
                    placeholderEl.textContent = words.slice(0, wordIdx).join(' ');
                    // Smooth, rapid cadence per word (48ms)
                    placeholderTypewriterTimer = setTimeout(streamNextWord, 48);
                } else {
                    isStreamingWords = false;
                    if (tabBadge) {
                        tabBadge.classList.remove('opacity-0');
                        tabBadge.style.opacity = '1';
                    }

                    // Hold for ~4 seconds before cleanly fading out
                    placeholderHoldTimer = setTimeout(() => {
                        const isHoldingFocused = isHomePromptFocused || document.activeElement === homePrompt;
                        if ((homePrompt && homePrompt.value.trim().length > 0) || isHoldingFocused) return;
                        
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            const isStillFocused = isHomePromptFocused || document.activeElement === homePrompt;
                            if ((homePrompt && homePrompt.value.trim().length > 0) || isStillFocused) return;
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

        function initImageHomeView() {
            const homePrompt = document.getElementById('image-home-prompt-input');
            const homeSubmit = document.getElementById('image-home-submit-btn');
            const fileInput = document.getElementById('image-home-file-input');
            const refSlot = document.getElementById('image-home-ref-slot');
            const ghostSlot = document.getElementById('image-home-ghost-slot');
            const refRemove = document.getElementById('image-home-ref-remove');
            const refPreview = document.getElementById('image-home-ref-preview');
            const refThumb = document.getElementById('image-home-ref-thumb');
            const backToHomeBtn = document.getElementById('ideogram-back-to-home-btn');
            const placeholderOverlay = document.getElementById('image-home-placeholder-overlay');
            const viewAllBtn = document.getElementById('image-home-view-all-btn');

            startPlaceholderRotation();

            function syncSubmitButtonState() {
                if (!homePrompt || !homeSubmit) return;
                const hasText = homePrompt.value.trim().length > 0;
                homeSubmit.disabled = !hasText;
                if (hasText) {
                    homeSubmit.className = "w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 hover:opacity-90";
                } else {
                    homeSubmit.className = "w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-xs";
                }
            }

            if (homePrompt) {
                homePrompt.addEventListener('focus', () => {
                    isHomePromptFocused = true;
                    updatePlaceholderVisibility();
                });

                homePrompt.addEventListener('blur', () => {
                    isHomePromptFocused = false;
                    updatePlaceholderVisibility();
                });

                homePrompt.addEventListener('input', () => {
                    syncSubmitButtonState();
                    updatePlaceholderVisibility();
                });

                homePrompt.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        const currentVal = homePrompt.value.trim();
                        if (!currentVal) {
                            e.preventDefault();
                            homePrompt.value = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex];
                            syncSubmitButtonState();
                            updatePlaceholderVisibility();
                        }
                        return;
                    }

                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (homePrompt.value.trim().length > 0) {
                            submitHomePrompt();
                        }
                    }
                });
            }

            const inputWrapper = document.getElementById('image-home-input-wrapper');
            if (inputWrapper) {
                inputWrapper.addEventListener('click', () => {
                    if (homePrompt) homePrompt.focus();
                });
            }
            if (placeholderOverlay) {
                placeholderOverlay.addEventListener('click', () => {
                    if (homePrompt) homePrompt.focus();
                });
            }

            if (homeSubmit) {
                homeSubmit.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (homePrompt && homePrompt.value.trim().length > 0) {
                        submitHomePrompt();
                    }
                });
            }

            `;

html = html.slice(0, oldJsRegionStart) + newJsRegion + html.slice(oldJsRegionEnd);
console.log('✓ Updated JavaScript focus/blur/input visibility and tab copying logic');

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Successfully wrote index.html');

