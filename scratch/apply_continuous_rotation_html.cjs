const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const oldVisibilityAndStream = `        function updatePlaceholderVisibility() {
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

const newVisibilityAndStream = `        function updatePlaceholderVisibility() {
            const overlay = document.getElementById('image-home-placeholder-overlay');
            const homePrompt = document.getElementById('image-home-prompt-input');
            if (!overlay || !homePrompt) return;

            const hasText = homePrompt.value.trim().length > 0;
            if (hasText) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '0';
                stopTypewriterStreaming();
            } else {
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '1';
                // If user cleared text and rotation is not currently running, resume smoothly
                if (!isStreamingWords && !placeholderHoldTimer && !placeholderTypewriterTimer) {
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

            // ONLY hide or pause rotation when the input contains user-entered text
            if (homePrompt && homePrompt.value.trim().length > 0) {
                overlay.classList.add('opacity-0', 'pointer-events-none');
                overlay.style.opacity = '0';
                return;
            }

            // Input is empty - ensure overlay is visible and continue rotating smoothly (never pause on focus)
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

                // Stop if user typed text
                if (homePrompt && homePrompt.value.trim().length > 0) {
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

                    // Hold for ~4 seconds before cleanly fading out and advancing to next prompt
                    placeholderHoldTimer = setTimeout(() => {
                        if (homePrompt && homePrompt.value.trim().length > 0) return;

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
        }`;

if (!html.includes(oldVisibilityAndStream)) {
  console.error('Could not find oldVisibilityAndStream in index.html');
  process.exit(1);
}
html = html.replace(oldVisibilityAndStream, newVisibilityAndStream);
console.log('✓ Continuous rotation streamCurrentPrompt logic updated in index.html');

const oldListeners = `            if (homePrompt) {
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
                });`;

const newListeners = `            if (homePrompt) {
                homePrompt.addEventListener('focus', () => {
                    isHomePromptFocused = true;
                    // Keep rotating continuously on focus - do NOT freeze or pause
                    updatePlaceholderVisibility();
                });

                homePrompt.addEventListener('blur', () => {
                    isHomePromptFocused = false;
                    // Keep rotating continuously on blur
                    updatePlaceholderVisibility();
                });

                homePrompt.addEventListener('input', () => {
                    adjustHomePromptHeight();
                    syncSubmitButtonState();
                    updatePlaceholderVisibility();
                });`;

if (!html.includes(oldListeners)) {
  console.error('Could not find oldListeners in index.html');
  process.exit(1);
}
html = html.replace(oldListeners, newListeners);
console.log('✓ Focus/blur listeners updated to keep rotation continuous in index.html');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully updated index.html!');

