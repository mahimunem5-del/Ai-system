const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Update Row 2 markup
const oldRow2 = `<!-- Row 2: Prompt Input Container (Middle - Centered with flexible growth) -->
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

const newRow2 = `<!-- Row 2: Prompt Input Container (Middle - Centered with flexible growth) -->
                        <div class="relative flex-1 flex items-center w-full min-h-[68px] cursor-text" id="image-home-input-wrapper">
                            <!-- 1. Rotating Typewriter Placeholder Layer (Directly underneath with exact identical CSS & vertical alignment) -->
                            <div id="image-home-placeholder-overlay"
                                class="pointer-events-none absolute left-0 top-0 w-full h-full flex items-center select-none text-sm sm:text-[15px] font-normal leading-relaxed text-slate-400 dark:text-neutral-500 m-0 p-0 transition-opacity duration-200 z-0">
                                <span id="image-home-placeholder-text"></span><span id="image-home-tab-badge" class="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider opacity-0 transition-opacity duration-300 align-baseline">Tab</span>
                            </div>

                            <!-- 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) -->
                            <textarea id="image-home-prompt-input" rows="1"
                                class="w-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] font-normal text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed block overflow-hidden relative z-10"
                                spellcheck="false"></textarea>
                        </div>`;

if (!html.includes(oldRow2)) {
  console.error('Could not find oldRow2 in index.html');
  process.exit(1);
}
html = html.replace(oldRow2, newRow2);
console.log('✓ Row 2 markup updated');

// 2. Remove default auto-focus in switchImageMode
const oldAutoFocus = `                const homeInput = document.getElementById('image-home-prompt-input');
                if (homeInput && !options.noFocus) {
                    setTimeout(() => homeInput.focus(), 80);
                }`;

const newAutoFocus = `                const homeInput = document.getElementById('image-home-prompt-input');
                // Stay unfocused/idle on page load without active blinking cursor
                if (options.focus && homeInput) {
                    setTimeout(() => homeInput.focus(), 80);
                }`;

if (!html.includes(oldAutoFocus)) {
  console.error('Could not find oldAutoFocus in index.html');
  process.exit(1);
}
html = html.replace(oldAutoFocus, newAutoFocus);
console.log('✓ Auto-focus removed from default view switch');

// 3. Update updatePlaceholderVisibility, streamCurrentPrompt, and handlers
const oldVisibilityAndStream = `        function updatePlaceholderVisibility() {
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
        }`;

const newVisibilityAndStream = `        function updatePlaceholderVisibility() {
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const homePrompt = document.getElementById('image-home-prompt-input');
            if (!overlay || !homePrompt) return;

            const hasText = homePrompt.value.length > 0;
            if (hasText) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '0';
            } else {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '1';
            }
        }

        function streamCurrentPrompt() {
            stopTypewriterStreaming();
            const homePrompt = document.getElementById('image-home-prompt-input');
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const placeholderEl = document.getElementById('image-home-placeholder-text');
            const tabBadge = document.getElementById('image-home-tab-badge');

            if (!placeholderEl || !overlay) return;

            // When user has typed text, instantly hide
            if (homePrompt && homePrompt.value.length > 0) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '0';
                return;
            }

            // When focused but empty, pause rotation and keep current placeholder visible as a ghost target
            if (isHomePromptFocused || (homePrompt && document.activeElement === homePrompt)) {
                if (!placeholderEl.textContent) {
                    placeholderEl.textContent = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex] || '';
                }
                if (tabBadge) {
                    tabBadge.classList.remove('opacity-0');
                    tabBadge.style.opacity = '1';
                }
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '1';
                return;
            }

            // When unfocused and empty: stream word-by-word
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
                
                // If user types, instantly hide
                if (homePrompt && homePrompt.value.length > 0) {
                    stopTypewriterStreaming();
                    overlay.classList.add('opacity-0', 'pointer-events-none');
                    overlay.style.opacity = '0';
                    return;
                }

                // If user focused into empty prompt box, pause and show full phrase as ghost placeholder
                if (isHomePromptFocused || (homePrompt && document.activeElement === homePrompt)) {
                    stopTypewriterStreaming();
                    placeholderEl.textContent = phrase;
                    if (tabBadge) {
                        tabBadge.classList.remove('opacity-0');
                        tabBadge.style.opacity = '1';
                    }
                    overlay.classList.remove('opacity-0', 'pointer-events-none');
                    overlay.style.opacity = '1';
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
                        const isHoldingFocused = isHomePromptFocused || (homePrompt && document.activeElement === homePrompt);
                        if ((homePrompt && homePrompt.value.length > 0) || isHoldingFocused) return;
                        
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            const isStillFocused = isHomePromptFocused || (homePrompt && document.activeElement === homePrompt);
                            if ((homePrompt && homePrompt.value.length > 0) || isStillFocused) return;
                            currentPlaceholderIndex = (currentPlaceholderIndex + 1) % IDEOGRAM_ROTATING_PLACEHOLDERS.length;
                            streamCurrentPrompt();
                        }, 260);
                    }, 4000);
                }
            }

            streamNextWord();
        }`;

if (!html.includes(oldVisibilityAndStream)) {
  console.error('Could not find oldVisibilityAndStream in index.html');
  process.exit(1);
}
html = html.replace(oldVisibilityAndStream, newVisibilityAndStream);
console.log('✓ Visibility and typewriter streaming updated');

// 4. Update initImageHomeView prompt listeners with auto-height adjustment and ghost placeholder on focus
const oldListeners = `            if (homePrompt) {
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
            }`;

const newListeners = `            function adjustHomePromptHeight() {
                if (!homePrompt) return;
                if (!homePrompt.value.length) {
                    homePrompt.style.height = '';
                    homePrompt.rows = 1;
                    homePrompt.style.overflowY = 'hidden';
                    return;
                }
                homePrompt.style.height = 'auto';
                const scrollH = homePrompt.scrollHeight;
                homePrompt.style.height = Math.min(scrollH, 140) + 'px';
                homePrompt.style.overflowY = scrollH > 140 ? 'auto' : 'hidden';
            }

            if (homePrompt) {
                homePrompt.addEventListener('focus', () => {
                    isHomePromptFocused = true;
                    updatePlaceholderVisibility();
                    if (!homePrompt.value.length) {
                        const placeholderEl = document.getElementById('image-home-placeholder-text');
                        const tabBadge = document.getElementById('image-home-tab-badge');
                        if (placeholderEl && !placeholderEl.textContent) {
                            placeholderEl.textContent = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex] || '';
                        }
                        if (tabBadge) {
                            tabBadge.classList.remove('opacity-0');
                            tabBadge.style.opacity = '1';
                        }
                    }
                });

                homePrompt.addEventListener('blur', () => {
                    isHomePromptFocused = false;
                    updatePlaceholderVisibility();
                    if (!homePrompt.value.length && !isStreamingWords && !placeholderHoldTimer) {
                        streamCurrentPrompt();
                    }
                });

                homePrompt.addEventListener('input', () => {
                    adjustHomePromptHeight();
                    syncSubmitButtonState();
                    updatePlaceholderVisibility();
                });

                homePrompt.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (!homePrompt.value.length) {
                            e.preventDefault();
                            homePrompt.value = IDEOGRAM_ROTATING_PLACEHOLDERS[currentPlaceholderIndex] || '';
                            adjustHomePromptHeight();
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
            }`;

if (!html.includes(oldListeners)) {
  console.error('Could not find oldListeners in index.html');
  process.exit(1);
}
html = html.replace(oldListeners, newListeners);
console.log('✓ Prompt event listeners and height adjustment updated');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully updated index.html!');

