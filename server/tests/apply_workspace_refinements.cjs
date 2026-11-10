const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// =========================================================================
// 1. Remove New Image button from Image Workspace header
// =========================================================================
const headerTargetRegex = /<!-- Right: Header Actions \(Share & New Image\) -->[\s\S]*?<button id="image-chat-new-btn"[\s\S]*?<\/button>\s*<\/div>/;
const headerReplacement = `<!-- Right: Header Actions (Share) -->
                <div class="flex items-center gap-2">
                    <button id="image-chat-share-btn" type="button"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer select-none"
                        title="Share this conversation">
                        <svg class="w-3.5 h-3.5 text-current shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" x2="12" y1="2" y2="15"/>
                        </svg>
                        <span class="hidden sm:inline">Share</span>
                    </button>
                </div>`;

if (!headerTargetRegex.test(content)) {
    console.error('Error: Could not match headerTargetRegex');
    process.exit(1);
}
content = content.replace(headerTargetRegex, headerReplacement);
console.log('1. Header: New Image button successfully removed.');

// =========================================================================
// 2. Update Image Workspace Model Selector Trigger & Dropdown Markup
// =========================================================================
const modelWrapperRegex = /<!-- Model Selector Dropdown -->\s*<div class="relative" id="image-chat-model-wrapper">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<!-- Right Controls: Mic & Send Button -->/;
const modelWrapperReplacement = `<!-- Model Selector Dropdown -->
                            <div class="relative" id="image-chat-model-wrapper">
                                <button id="image-chat-model-btn" type="button"
                                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all cursor-pointer shadow-2xs">
                                    <span id="image-chat-model-icon" class="flex items-center shrink-0">
                                        <svg class="w-4 h-4 shrink-0 text-zinc-900 dark:text-zinc-100" viewBox="60 60 392 392" fill="currentColor">
                                            <path fill-rule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
                                        </svg>
                                    </span>
                                    <span id="image-chat-model-label" class="text-xs font-medium text-zinc-800 dark:text-zinc-200 max-w-[140px] truncate">GPT Image 2.5 Sunburst</span>
                                    <svg class="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>

                                <div id="image-chat-model-dropdown"
                                    class="hidden absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-80 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl text-xs z-50">
                                    <div class="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase px-2.5 py-1.5">Generation Model</div>
                                    <div id="image-chat-model-options-list" class="space-y-0.5">
                                        <!-- Populated dynamically via populateImageChatModelOptions() -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Controls: Mic & Send Button -->`;

if (!modelWrapperRegex.test(content)) {
    console.error('Error: Could not match modelWrapperRegex');
    process.exit(1);
}
content = content.replace(modelWrapperRegex, modelWrapperReplacement);
console.log('2. Image Workspace Model Selector markup updated.');

// =========================================================================
// 3. Define getStudioModelIconSvg and update send button / stop logic in JS
// =========================================================================
const updateSendButtonTargetRegex = /function updateImageChatSendButtonState\(\) \{[\s\S]*?btn\.disabled = isImageChatGenerating \|\| \(!hasText && !hasRef\);\s*\}/;
const updateSendButtonReplacement = `let activeImageChatAbortController = null;

        function getStudioModelIconSvg(modelId) {
            const id = (typeof OPENROUTER_IMAGE_MODEL_MAP !== 'undefined' && OPENROUTER_IMAGE_MODEL_MAP[modelId]) ? OPENROUTER_IMAGE_MODEL_MAP[modelId] : modelId;
            if (id === 'openai/gpt-image-2.5-sunburst') {
                return \`<svg class="w-4 h-4 shrink-0 text-zinc-900 dark:text-zinc-100" viewBox="60 60 392 392" fill="currentColor">
                    <path fill-rule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
                </svg>\`;
            }
            if (id === 'google/gemini-3-pro-image') {
                return \`<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><defs><linearGradient id="image-gemini-sparkle-pro" x1="85%" y1="15%" x2="15%" y2="85%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="50%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" style="fill:#2563EB;fill:url(#image-gemini-sparkle-pro);"/></svg>\`;
            }
            if (id === 'black-forest-labs/flux.2-pro') {
                return \`<svg class="w-4 h-4 shrink-0 text-zinc-900 dark:text-zinc-100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.2l7.5 4.1L12 12.4 4.5 8.3 12 4.2zM4 9.8l7 3.8v7.6l-7-3.8V9.8zm16 7.6l-7 3.8v-7.6l7-3.8v7.6z"/></svg>\`;
            }
            if (id === 'bytedance-seed/seedream-5.0-pro') {
                return \`<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6" width="3.2" height="12" rx="1.6" fill="#3B82F6"/><rect x="7.8" y="3" width="3.2" height="18" rx="1.6" fill="#06B6D4"/><rect x="13.1" y="6" width="3.2" height="15" rx="1.6" fill="#3B82F6"/><rect x="18.4" y="8" width="3.2" height="10" rx="1.6" fill="#06B6D4"/></svg>\`;
            }
            if (id === 'meta/muse-image') {
                return \`<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0081FB"><path d="M16.995 3C14.636 3 12.748 4.316 12 5.864 11.252 4.316 9.364 3 7.005 3 3.136 3 0 6.136 0 10.005c0 3.869 3.136 7.005 7.005 7.005 2.359 0 4.247-1.316 4.995-2.864.748 1.548 2.636 2.864 4.995 2.864 3.869 0 7.005-3.136 7.005-7.005C24 6.136 20.864 3 16.995 3zm0 11.96c-1.898 0-3.568-1.074-4.39-2.73a.873.873 0 0 0-1.21 0c-.822 1.656-2.492 2.73-4.39 2.73-2.732 0-4.955-2.223-4.955-4.955s2.223-4.955 4.955-4.955c1.898 0 3.568 1.074 4.39 2.73a.873.873 0 0 0 1.21 0c.822-1.656 2.492-2.73 4.39-2.73 2.732 0 4.955 2.223 4.955 4.955s-2.223 4.955-4.955 4.955z"/></svg>\`;
            }
            if (id === 'google/gemini-3.1-flash-image-preview') {
                return \`<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24"><defs><linearGradient id="image-gemini-sparkle-flash" x1="85%" y1="15%" x2="15%" y2="85%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="50%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" style="fill:#2563EB;fill:url(#image-gemini-sparkle-flash);"/></svg>\`;
            }
            return \`<svg class="w-4 h-4 shrink-0 text-zinc-900 dark:text-zinc-100" viewBox="60 60 392 392" fill="currentColor">
                <path fill-rule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
            </svg>\`;
        }

        function updateImageChatSendButtonState() {
            const input = document.getElementById('image-chat-input');
            const btn = document.getElementById('image-chat-send-btn');
            if (!btn) return;

            if (isImageChatGenerating) {
                btn.disabled = false;
                btn.setAttribute('data-state', 'stop');
                btn.setAttribute('title', 'Stop generation');
                btn.setAttribute('aria-label', 'Stop generation');
                btn.className = 'w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95';
                btn.innerHTML = \`
                    <svg class="w-3 h-3 fill-current pointer-events-none" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="1.5" />
                    </svg>
                \`;
                return;
            }

            btn.setAttribute('data-state', 'send');
            btn.setAttribute('title', 'Send message');
            btn.setAttribute('aria-label', 'Send message');
            btn.className = 'w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm cursor-pointer';
            btn.innerHTML = \`
                <svg class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
            \`;

            const hasText = !!(input && input.value.trim().length > 0);
            const hasRef = !!imageChatState.referenceImage;
            btn.disabled = (!hasText && !hasRef);
        }

        function stopImageChatGeneration() {
            if (activeImageChatAbortController) {
                try {
                    activeImageChatAbortController.abort();
                } catch (_) { }
                activeImageChatAbortController = null;
            }
            isImageChatGenerating = false;
            const loadIdx = imageChatState.turns.findIndex(t => t.isLoading);
            if (loadIdx !== -1) {
                imageChatState.turns.splice(loadIdx, 1);
            }
            renderImageChatConversation();
            updateImageChatSendButtonState();
            if (typeof showStudioToast === 'function') {
                showStudioToast('Generation stopped');
            }
        }
        window.stopImageChatGeneration = stopImageChatGeneration;`;

if (!updateSendButtonTargetRegex.test(content)) {
    console.error('Error: Could not match updateSendButtonTargetRegex');
    process.exit(1);
}
content = content.replace(updateSendButtonTargetRegex, updateSendButtonReplacement);
console.log('3. getStudioModelIconSvg, updateImageChatSendButtonState, and stopImageChatGeneration added.');

// =========================================================================
// 4. Update syncImageChatComposerControls to update model icon & label
// =========================================================================
const syncComposerRegex = /function syncImageChatComposerControls\(\) \{[\s\S]*?updateImageChatSendButtonState\(\);\s*\}/;
const syncComposerReplacement = `function syncImageChatComposerControls() {
            // Aspect ratio
            const ratioLabel = document.getElementById('image-chat-ratio-label');
            if (ratioLabel) ratioLabel.textContent = imageChatState.aspectRatio || '1:1';

            // Count
            const countLabel = document.getElementById('image-chat-count-label');
            if (countLabel) {
                const count = imageChatState.imageCount || 1;
                countLabel.textContent = \`\${count} image\${count > 1 ? 's' : ''}\`;
            }

            // Model
            const activeModelId = imageChatState.model || imageStudioState.model || IMAGE_MODELS[0].id;
            const normalizedActiveId = (typeof OPENROUTER_IMAGE_MODEL_MAP !== 'undefined' && OPENROUTER_IMAGE_MODEL_MAP[activeModelId]) ? OPENROUTER_IMAGE_MODEL_MAP[activeModelId] : activeModelId;
            const selectedObj = IMAGE_MODELS.find(m => m.id === normalizedActiveId || m.id === activeModelId);
            const modelName = selectedObj ? selectedObj.name : activeModelId;

            const modelLabel = document.getElementById('image-chat-model-label');
            if (modelLabel) modelLabel.textContent = modelName;

            const modelIcon = document.getElementById('image-chat-model-icon');
            if (modelIcon) modelIcon.innerHTML = getStudioModelIconSvg(activeModelId);

            const headerModel = document.getElementById('image-chat-header-model-name');
            if (headerModel) headerModel.textContent = modelName;

            updateImageChatSendButtonState();
        }`;

if (!syncComposerRegex.test(content)) {
    console.error('Error: Could not match syncComposerRegex');
    process.exit(1);
}
content = content.replace(syncComposerRegex, syncComposerReplacement);
console.log('4. syncImageChatComposerControls updated.');

// =========================================================================
// 5. Update dispatchImageChatTurn to connect activeImageChatAbortController
// =========================================================================
const dispatchRegex = /async function dispatchImageChatTurn\(promptText, overrides = \{\}\) \{[\s\S]*?isImageChatGenerating = true;\s*updateImageChatSendButtonState\(\);/;
const dispatchReplacement = `async function dispatchImageChatTurn(promptText, overrides = {}) {
            if (isImageChatGenerating) return;

            const trimmedPrompt = (promptText || '').trim();
            const refData = overrides.referenceImage || imageChatState.referenceImage || null;

            if (!trimmedPrompt && !refData) return;

            isImageChatGenerating = true;
            activeImageChatAbortController = new AbortController();
            updateImageChatSendButtonState();`;

if (!dispatchRegex.test(content)) {
    console.error('Error: Could not match dispatchRegex');
    process.exit(1);
}
content = content.replace(dispatchRegex, dispatchReplacement);

// Update fetch in dispatchImageChatTurn to include signal and abort handling in catch
const fetchRegex = /const response = await fetch\(`\$\{apiBase\}\/api\/generate-image`, \{[\s\S]*?method: 'POST',/;
const fetchReplacement = `const response = await fetch(\`\${apiBase}/api/generate-image\`, {
                    method: 'POST',
                    signal: activeImageChatAbortController ? activeImageChatAbortController.signal : undefined,`;

if (!fetchRegex.test(content)) {
    console.error('Error: Could not match fetchRegex');
    process.exit(1);
}
content = content.replace(fetchRegex, fetchReplacement);

// Update while loop in SSE stream to check abort
const streamWhileRegex = /while \(true\) \{\s*const \{ done, value \} = await reader\.read\(\);/;
const streamWhileReplacement = `while (true) {
                        if (!isImageChatGenerating || (activeImageChatAbortController && activeImageChatAbortController.signal.aborted)) {
                            try { reader.cancel(); } catch (_) { }
                            break;
                        }
                        const { done, value } = await reader.read();`;

if (!streamWhileRegex.test(content)) {
    console.error('Error: Could not match streamWhileRegex');
    process.exit(1);
}
content = content.replace(streamWhileRegex, streamWhileReplacement);

// Update catch block in dispatchImageChatTurn
const catchRegex = /\} catch \(err\) \{\s*console\.error\('Image Chat generation error:', err\);/;
const catchReplacement = `} catch (err) {
                if (err.name === 'AbortError' || (activeImageChatAbortController && activeImageChatAbortController.signal.aborted)) {
                    console.log('Image generation aborted by user.');
                    isImageChatGenerating = false;
                    activeImageChatAbortController = null;
                    const loadIdx = imageChatState.turns.findIndex(t => t.id === loadingTurn.id || t.isLoading);
                    if (loadIdx !== -1) {
                        imageChatState.turns.splice(loadIdx, 1);
                    }
                    renderImageChatConversation();
                    updateImageChatSendButtonState();
                    return;
                }
                console.error('Image Chat generation error:', err);`;

if (!catchRegex.test(content)) {
    console.error('Error: Could not match catchRegex');
    process.exit(1);
}
content = content.replace(catchRegex, catchReplacement);

// Reset activeImageChatAbortController on finish
const normalFinishRegex = /isImageChatGenerating = false;\s*updateImageChatSendButtonState\(\);\s*renderImageChatConversation\(\);/;
const normalFinishReplacement = `isImageChatGenerating = false;
                activeImageChatAbortController = null;
                updateImageChatSendButtonState();
                renderImageChatConversation();`;

if (!normalFinishRegex.test(content)) {
    console.error('Error: Could not match normalFinishRegex');
    process.exit(1);
}
content = content.replace(normalFinishRegex, normalFinishReplacement);
console.log('5. dispatchImageChatTurn connected to activeImageChatAbortController.');

// =========================================================================
// 6. Define setImageModelSelection and update populateImageChatModelOptions
// =========================================================================
const populateOptionsRegex = /\/\/ Populate Model Options in Image Chat Dropdown\s*function populateImageChatModelOptions\(\) \{[\s\S]*?container\.appendChild\(btn\);\s*\}\);\s*\}/;
const populateOptionsReplacement = `// Synchronizes model selection across Main Generator and Image Workspace
        function setImageModelSelection(modelId) {
            const normalizedId = (typeof OPENROUTER_IMAGE_MODEL_MAP !== 'undefined' && OPENROUTER_IMAGE_MODEL_MAP[modelId]) ? OPENROUTER_IMAGE_MODEL_MAP[modelId] : modelId;
            const modelObj = IMAGE_MODELS.find(m => m.id === normalizedId || m.id === modelId) || IMAGE_MODELS[0];
            const actualId = modelObj.id;
            const modelName = modelObj.name;

            imageStudioState.model = actualId;
            imageChatState.model = actualId;

            // 1. Update main studio trigger
            const studioLabel = document.getElementById('studio-model-label');
            if (studioLabel) studioLabel.textContent = modelName;
            const studioIcon = document.getElementById('studio-model-icon');
            if (studioIcon) studioIcon.innerHTML = getStudioModelIconSvg(actualId);

            // 2. Update main studio dropdown option rows
            const studioDrop = document.getElementById('studio-model-dropdown');
            if (studioDrop) {
                studioDrop.querySelectorAll('.studio-model-option').forEach(o => {
                    const isSelected = o.dataset.model === actualId || (typeof OPENROUTER_IMAGE_MODEL_MAP !== 'undefined' && OPENROUTER_IMAGE_MODEL_MAP[o.dataset.model] === actualId);
                    if (isSelected) {
                        o.classList.add('bg-zinc-100/60');
                        o.classList.remove('hover:bg-zinc-50');
                    } else {
                        o.classList.remove('bg-zinc-100/60');
                        o.classList.add('hover:bg-zinc-50');
                    }
                    const nameSpan = o.querySelector('.studio-model-name');
                    if (nameSpan) {
                        nameSpan.classList.toggle('font-semibold', isSelected);
                        nameSpan.classList.toggle('font-medium', !isSelected);
                    }
                    const checkSvg = o.querySelector('.studio-model-check');
                    if (checkSvg) {
                        checkSvg.classList.toggle('hidden', !isSelected);
                    }
                });
            }

            // 3. Update image workspace composer & dropdown
            syncImageChatComposerControls();
            populateImageChatModelOptions();
        }
        window.setImageModelSelection = setImageModelSelection;

        // Populate Model Options in Image Chat Dropdown
        function populateImageChatModelOptions() {
            const container = document.getElementById('image-chat-model-options-list');
            if (!container) return;

            container.innerHTML = '';
            const activeModelId = imageChatState.model || imageStudioState.model || IMAGE_MODELS[0].id;
            const normalizedActiveId = (typeof OPENROUTER_IMAGE_MODEL_MAP !== 'undefined' && OPENROUTER_IMAGE_MODEL_MAP[activeModelId]) ? OPENROUTER_IMAGE_MODEL_MAP[activeModelId] : activeModelId;

            IMAGE_MODELS.forEach(m => {
                const isSelected = m.id === activeModelId || m.id === normalizedActiveId;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.model = m.id;
                btn.dataset.name = m.name;
                btn.className = \`image-chat-model-option w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors group text-left \${
                    isSelected ? 'bg-zinc-100/60 dark:bg-zinc-800/80 font-semibold text-zinc-900 dark:text-zinc-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200'
                }\`;

                const iconSvg = getStudioModelIconSvg(m.id);
                btn.innerHTML = \`
                    <div class="flex items-center gap-2.5 min-w-0">
                        \${iconSvg}
                        <span class="image-chat-model-name text-xs \${isSelected ? 'font-semibold text-zinc-800 dark:text-zinc-100' : 'font-medium text-zinc-800 dark:text-zinc-200'} group-hover:text-black dark:group-hover:text-white truncate">\${escapeHtml(m.name)}</span>
                    </div>
                    <svg class="image-chat-model-check \${isSelected ? '' : 'hidden'} w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                \`;

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setImageModelSelection(m.id);
                    const drop = document.getElementById('image-chat-model-dropdown');
                    if (drop) drop.classList.add('hidden');
                });

                container.appendChild(btn);
            });
        }`;

if (!populateOptionsRegex.test(content)) {
    console.error('Error: Could not match populateOptionsRegex');
    process.exit(1);
}
content = content.replace(populateOptionsRegex, populateOptionsReplacement);
console.log('6. setImageModelSelection and updated populateImageChatModelOptions added.');

// =========================================================================
// 7. Update listeners in initImageChatWorkspaceListeners
// =========================================================================
// Remove newBtn listener if present and connect sendBtn stop handler
const listenersTargetRegex = /\/\/ Send button\s*const sendBtn = document\.getElementById\('image-chat-send-btn'\);\s*if \(sendBtn\) \{\s*sendBtn\.addEventListener\('click', \(e\) => \{\s*e\.preventDefault\(\);\s*sendImageChatMessage\(\);\s*\}\);\s*\}/;
const listenersReplacement = `// Send / Stop button (ChatGPT Style Generation Control)
            const sendBtn = document.getElementById('image-chat-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (isImageChatGenerating) {
                        stopImageChatGeneration();
                        return;
                    }
                    sendImageChatMessage();
                });
            }`;

if (!listenersTargetRegex.test(content)) {
    console.error('Error: Could not match listenersTargetRegex');
    process.exit(1);
}
content = content.replace(listenersTargetRegex, listenersReplacement);

// Also remove image-chat-new-btn listener from initImageChatWorkspaceListeners
const newBtnListenerRegex = /\/\/ New Image button\s*const newBtn = document\.getElementById\('image-chat-new-btn'\);[\s\S]*?\}\);\s*\}/;
if (newBtnListenerRegex.test(content)) {
    content = content.replace(newBtnListenerRegex, '// New Image button removed');
    console.log('7a. newBtn listener removed.');
}

// Update input enter key handler to prevent submission while generating
const enterKeyRegex = /input\.addEventListener\('keydown', \(e\) => \{\s*if \(e\.key === 'Enter' && !e\.shiftKey && !e\.isComposing\) \{\s*e\.preventDefault\(\);\s*sendImageChatMessage\(\);\s*\}\s*\}\);/;
const enterKeyReplacement = `input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                        e.preventDefault();
                        if (isImageChatGenerating) return;
                        sendImageChatMessage();
                    }
                });`;
if (enterKeyRegex.test(content)) {
    content = content.replace(enterKeyRegex, enterKeyReplacement);
    console.log('7b. Input enter key listener updated.');
}

// In initImageStudio, hook studio-model-option click to setImageModelSelection
const studioOptionClickRegex = /modelDrop\.querySelectorAll\('\.studio-model-option'\)\.forEach\(opt => \{\s*opt\.addEventListener\('click', \(e\) => \{\s*e\.stopPropagation\(\);\s*const model = opt\.dataset\.model;[\s\S]*?modelDrop\.classList\.add\('hidden'\);\s*\}\);\s*\}\);/;
const studioOptionClickReplacement = `modelDrop.querySelectorAll('.studio-model-option').forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const model = opt.dataset.model;
                        setImageModelSelection(model);
                        modelDrop.classList.add('hidden');
                    });
                });`;

if (studioOptionClickRegex.test(content)) {
    content = content.replace(studioOptionClickRegex, studioOptionClickReplacement);
    console.log('8. Main studio model selector hooked into setImageModelSelection.');
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('\n--- ALL REFINEMENTS APPLIED CLEANLY TO INDEX.HTML ---');
