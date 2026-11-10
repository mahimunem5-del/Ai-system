// scratch/apply_precise_edit_fixes.cjs
const fs = require('fs');

console.log('=== APPLYING PRECISE EDIT FIXES (IDEOGRAM MATCH & AUTO-FILL FIX) ===\n');

// ==========================================
// 1. UPDATE index.html
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Replace the source preview in ideogram-precise-edit-controls with Ideogram dropzone & preview
const oldPreciseSourceHtml = `                        <!-- 1. LARGE SOURCE IMAGE PREVIEW (IDEOGRAM STYLE) -->
                        <div class="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 group">
                            <img id="studio-precise-edit-thumb" src="" alt="Source image"
                                class="w-full object-cover max-h-[300px] block rounded-xl">
                            <button type="button" id="studio-precise-edit-remove-src-btn"
                                class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-sm shadow-md transition-all cursor-pointer z-10"
                                title="Remove source image">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6 6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>`;

const newPreciseSourceHtml = `                        <!-- 1. SOURCE IMAGE (IDEOGRAM MINIMALIST DROPZONE & PROPORTIONAL PREVIEW) -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-medium text-neutral-500 block mb-2">Image</label>
                            
                            <!-- Hidden File Input -->
                            <input type="file" id="studio-precise-edit-file-input" accept="image/png,image/jpeg,image/webp" class="hidden">
                            
                            <!-- Dropzone (Empty State) -->
                            <div id="studio-precise-edit-dropzone" class="relative w-full aspect-[4/3] max-h-[380px] rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-transparent transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400 font-normal">Upload or choose an image</span>
                                <button type="button" id="studio-precise-edit-add-btn" class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
                                    <span>+ Add</span>
                                </button>
                            </div>

                            <!-- Uploaded Image Preview (Filled State) -->
                            <div id="studio-precise-edit-preview-wrap" class="hidden relative w-full aspect-[4/3] max-h-[380px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center p-2 group">
                                <img id="studio-precise-edit-thumb" src="" alt="Source image" class="w-full h-full object-contain rounded-xl transition-all">
                                <button type="button" id="studio-precise-edit-remove-src-btn"
                                    class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md"
                                    title="Change image">✕</button>
                            </div>
                        </div>`;

if (html.includes(oldPreciseSourceHtml)) {
  html = html.replace(oldPreciseSourceHtml, newPreciseSourceHtml);
  console.log('✓ [index.html] Replaced precise edit source with Ideogram empty dropzone & proportional preview');
} else {
  console.error('✗ [index.html] oldPreciseSourceHtml not found');
}

// B. Replace the Apply Edit button with Ideogram standard button
const oldApplyBtnHtml = `                        <!-- 5. APPLY EDIT PRIMARY BUTTON -->
                        <div class="pt-2">
                            <button id="studio-apply-precise-edit-btn" type="button"
                                class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg id="studio-apply-precise-edit-icon" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
                                    <path d="m14 7 3 3"/>
                                    <path d="M5 6v4"/>
                                    <path d="M19 14v4"/>
                                    <path d="M10 2v2"/>
                                    <path d="M7 8H3"/>
                                    <path d="M21 16h-4"/>
                                    <path d="M11 3H9"/>
                                </svg>
                                <span id="studio-apply-precise-edit-spinner" class="hidden">
                                    <svg class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                                <span id="studio-apply-precise-edit-text">Apply edit</span>
                            </button>
                        </div>`;

const newApplyBtnHtml = `                        <!-- 5. APPLY EDIT PRIMARY BUTTON -->
                        <div class="pt-2">
                            <button id="studio-apply-precise-edit-btn" type="button" disabled
                                class="w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed">
                                <span id="studio-apply-precise-edit-spinner" class="hidden">
                                    <svg class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                                <span id="studio-apply-precise-edit-text">Apply edit</span>
                            </button>
                        </div>`;

if (html.includes(oldApplyBtnHtml)) {
  html = html.replace(oldApplyBtnHtml, newApplyBtnHtml);
  console.log('✓ [index.html] Updated Apply Edit button markup');
} else {
  console.error('✗ [index.html] oldApplyBtnHtml not found');
}

// C. Remove auto-fill in switchWorkflowTool
const oldSwitchToolPrecise = `            } else if (toolId === 'precise-edit') {
                if (editControls) editControls.classList.remove('hidden');
                if (!studioPreciseEditState.sourceItem && Array.isArray(STUDIO_RECENT_IMAGES) && STUDIO_RECENT_IMAGES.length > 0) {
                    const item = STUDIO_RECENT_IMAGES[0];
                    studioPreciseEditState.sourceItem = item;
                    const thumbEl = document.getElementById('studio-precise-edit-thumb');
                    const titleEl = document.getElementById('studio-precise-edit-source-title');
                    if (thumbEl) thumbEl.src = item.url || item.img || '';
                    if (titleEl) titleEl.textContent = item.originalPrompt || item.prompt || item.title || 'Original Image';
                }
            }`;

const newSwitchToolPrecise = `            } else if (toolId === 'precise-edit') {
                if (editControls) editControls.classList.remove('hidden');
                const dropzone = document.getElementById("studio-precise-edit-dropzone");
                const previewWrap = document.getElementById("studio-precise-edit-preview-wrap");
                if (studioPreciseEditState.sourceItem && (studioPreciseEditState.sourceItem.url || studioPreciseEditState.sourceItem.img)) {
                    if (dropzone) dropzone.classList.add("hidden");
                    if (previewWrap) previewWrap.classList.remove("hidden");
                } else {
                    if (dropzone) dropzone.classList.remove("hidden");
                    if (previewWrap) previewWrap.classList.add("hidden");
                }
                if (typeof updatePreciseEditButtonState === 'function') updatePreciseEditButtonState();
            }`;

if (html.includes(oldSwitchToolPrecise)) {
  html = html.replace(oldSwitchToolPrecise, newSwitchToolPrecise);
  console.log('✓ [index.html] Removed auto-fill from switchWorkflowTool');
} else {
  console.error('✗ [index.html] oldSwitchToolPrecise not found');
}

// D. Update enterStudioPreciseEdit to handle empty state and toggle dropzone/preview
const oldEnterPrecise = `            // Populate source thumbnail & title
            const thumbEl = document.getElementById("studio-precise-edit-thumb");
            const titleEl = document.getElementById("studio-precise-edit-source-title");
            if (thumbEl) thumbEl.src = item.url || item.img || "";
            if (titleEl) titleEl.textContent = (item.originalPrompt || item.prompt || item.title || "Original Image");`;

const newEnterPrecise = `            // Populate source thumbnail & toggle dropzone / preview
            const dropzone = document.getElementById("studio-precise-edit-dropzone");
            const previewWrap = document.getElementById("studio-precise-edit-preview-wrap");
            const thumbEl = document.getElementById("studio-precise-edit-thumb");
            const titleEl = document.getElementById("studio-precise-edit-source-title");
            const fileInput = document.getElementById("studio-precise-edit-file-input");

            if (item && (item.url || item.img)) {
                studioPreciseEditState.sourceItem = item;
                if (thumbEl) thumbEl.src = item.url || item.img;
                if (titleEl) titleEl.textContent = (item.originalPrompt || item.prompt || item.title || "Original Image");
                if (dropzone) dropzone.classList.add("hidden");
                if (previewWrap) previewWrap.classList.remove("hidden");
            } else {
                studioPreciseEditState.sourceItem = null;
                if (thumbEl) thumbEl.src = "";
                if (titleEl) titleEl.textContent = "Original Image";
                if (fileInput) fileInput.value = "";
                if (dropzone) dropzone.classList.remove("hidden");
                if (previewWrap) previewWrap.classList.add("hidden");
            }
            if (typeof updatePreciseEditButtonState === 'function') updatePreciseEditButtonState();`;

if (html.includes(oldEnterPrecise)) {
  html = html.replace(oldEnterPrecise, newEnterPrecise);
  console.log('✓ [index.html] Updated enterStudioPreciseEdit to handle empty and filled states');
} else {
  console.error('✗ [index.html] oldEnterPrecise not found');
}

// E. Add clearStudioPreciseEditSource & update removeSrcBtn listener (Do NOT Exit Tool!)
const oldRemoveSrcBtnListener = `            const removeSrcBtn = document.getElementById("studio-precise-edit-remove-src-btn");
            if (removeSrcBtn) {
                removeSrcBtn.addEventListener("click", () => {
                    exitStudioPreciseEdit();
                    showStudioToast("Exited edit mode");
                });
            }`;

const newRemoveSrcBtnListener = `            // Precise Edit Source Clear Handler (Remain inside Precise Edit tool)
            function clearStudioPreciseEditSource() {
                studioPreciseEditState.sourceItem = null;
                studioPreciseEditState.sourceCard = null;
                const fileInput = document.getElementById("studio-precise-edit-file-input");
                if (fileInput) fileInput.value = "";
                const thumbEl = document.getElementById("studio-precise-edit-thumb");
                if (thumbEl) thumbEl.src = "";
                const dropzone = document.getElementById("studio-precise-edit-dropzone");
                const previewWrap = document.getElementById("studio-precise-edit-preview-wrap");
                if (dropzone) dropzone.classList.remove("hidden");
                if (previewWrap) previewWrap.classList.add("hidden");
                updatePreciseEditButtonState();
            }
            window.clearStudioPreciseEditSource = clearStudioPreciseEditSource;

            const removeSrcBtn = document.getElementById("studio-precise-edit-remove-src-btn");
            if (removeSrcBtn) {
                removeSrcBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    clearStudioPreciseEditSource();
                });
            }

            // Precise Edit Source Upload & Drag/Drop Handling
            const preciseFileInput = document.getElementById("studio-precise-edit-file-input");
            const preciseDropzone = document.getElementById("studio-precise-edit-dropzone");
            const preciseAddBtn = document.getElementById("studio-precise-edit-add-btn");
            const precisePreviewWrap = document.getElementById("studio-precise-edit-preview-wrap");
            const preciseThumbEl = document.getElementById("studio-precise-edit-thumb");

            function handlePreciseSourceFile(file) {
                if (!file || !file.type.startsWith("image/")) {
                    showStudioToast("Please upload a valid image file (PNG, JPG, or WebP)");
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    studioPreciseEditState.sourceItem = {
                        id: 'upload-' + Date.now(),
                        url: dataUrl,
                        img: dataUrl,
                        title: file.name,
                        prompt: file.name
                    };
                    if (preciseThumbEl) preciseThumbEl.src = dataUrl;
                    if (preciseDropzone) preciseDropzone.classList.add("hidden");
                    if (precisePreviewWrap) precisePreviewWrap.classList.remove("hidden");
                    updatePreciseEditButtonState();
                };
                reader.readAsDataURL(file);
            }

            if (preciseFileInput) {
                preciseFileInput.addEventListener("change", (e) => {
                    if (e.target.files && e.target.files[0]) handlePreciseSourceFile(e.target.files[0]);
                });
            }

            if (preciseAddBtn) {
                preciseAddBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (preciseFileInput) preciseFileInput.click();
                });
            }

            if (preciseDropzone) {
                preciseDropzone.addEventListener("click", () => {
                    if (preciseFileInput) preciseFileInput.click();
                });

                ['dragenter', 'dragover'].forEach(eventName => {
                    preciseDropzone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        preciseDropzone.classList.add('border-neutral-400', 'dark:border-neutral-500');
                    });
                });

                ['dragleave', 'dragend'].forEach(eventName => {
                    preciseDropzone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        preciseDropzone.classList.remove('border-neutral-400', 'dark:border-neutral-500');
                    });
                });

                preciseDropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    preciseDropzone.classList.remove('border-neutral-400', 'dark:border-neutral-500');
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handlePreciseSourceFile(e.dataTransfer.files[0]);
                    }
                });
            }

            const precisePromptInput = document.getElementById("studio-precise-edit-input");
            if (precisePromptInput) {
                precisePromptInput.addEventListener("input", updatePreciseEditButtonState);
            }`;

if (html.includes(oldRemoveSrcBtnListener)) {
  html = html.replace(oldRemoveSrcBtnListener, newRemoveSrcBtnListener);
  console.log('✓ [index.html] Replaced removeSrcBtn with clearStudioPreciseEditSource (does NOT exit mode)');
} else {
  console.error('✗ [index.html] oldRemoveSrcBtnListener not found');
}

// F. Add updatePreciseEditButtonState function
const stateAnchor = `        function exitStudioPreciseEdit() {`;
const updateBtnStateFn = `        function updatePreciseEditButtonState() {
            const applyBtn = document.getElementById("studio-apply-precise-edit-btn");
            if (!applyBtn) return;
            const hasSource = Boolean(studioPreciseEditState.sourceItem && (studioPreciseEditState.sourceItem.url || studioPreciseEditState.sourceItem.img));
            applyBtn.disabled = !hasSource;
            if (hasSource) {
                applyBtn.className = "w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100";
            } else {
                applyBtn.className = "w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed";
            }
        }
        window.updatePreciseEditButtonState = updatePreciseEditButtonState;

        function exitStudioPreciseEdit() {`;

if (!html.includes('function updatePreciseEditButtonState()') && html.includes(stateAnchor)) {
  html = html.replace(stateAnchor, updateBtnStateFn);
  console.log('✓ [index.html] Added updatePreciseEditButtonState function');
}

// In applyStudioPreciseEdit finally block, call updatePreciseEditButtonState
const oldFinally = `            } finally {
                if (applyBtn) applyBtn.disabled = false;
                if (applyIcon) applyIcon.classList.remove("hidden");
                if (applySpinner) applySpinner.classList.add("hidden");
                if (applyText) applyText.textContent = "Apply edit";
            }`;

const newFinally = `            } finally {
                if (applyIcon) applyIcon.classList.remove("hidden");
                if (applySpinner) applySpinner.classList.add("hidden");
                if (applyText) applyText.textContent = "Apply edit";
                updatePreciseEditButtonState();
            }`;

if (html.includes(oldFinally)) {
  html = html.replace(oldFinally, newFinally);
  console.log('✓ [index.html] Updated applyStudioPreciseEdit finally block');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Saved index.html successfully!');

// ==========================================
// 2. UPDATE src/components/ImageWorkspace.tsx
// ==========================================
let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

// A. Add precise edit file input and variations state
const oldTsxState = `  const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);
  const [removeBgFile, setRemoveBgFile] = useState<File | null>(null);
  const [isRemoveBgDragging, setIsRemoveBgDragging] = useState(false);
  const removeBgInputRef = useRef<HTMLInputElement>(null);`;

const newTsxState = `  const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);
  const [removeBgFile, setRemoveBgFile] = useState<File | null>(null);
  const [isRemoveBgDragging, setIsRemoveBgDragging] = useState(false);
  const removeBgInputRef = useRef<HTMLInputElement>(null);
  const [isPreciseDragging, setIsPreciseDragging] = useState(false);
  const preciseInputRef = useRef<HTMLInputElement>(null);
  const [preciseCount, setPreciseCount] = useState<number>(1);
  const [isPreciseCountOpen, setIsPreciseCountOpen] = useState(false);`;

if (!tsx.includes('isPreciseDragging') && tsx.includes(oldTsxState)) {
  tsx = tsx.replace(oldTsxState, newTsxState);
  console.log('✓ [ImageWorkspace.tsx] Added precise edit states and refs');
}

// B. Remove auto-fill in carousel card click
const oldCarouselClick = `                onClick={() => {
                  setWorkflowTool('precise-edit');
                  setMode('edit');
                  if (!sourceImage && assets.length > 0) {
                    setSourceImage(assets[0].url);
                  }
                  setView('workspace');
                }}`;

const newCarouselClick = `                onClick={() => {
                  setWorkflowTool('precise-edit');
                  setMode('edit');
                  setView('workspace');
                }}`;

if (tsx.includes(oldCarouselClick)) {
  tsx = tsx.replace(oldCarouselClick, newCarouselClick);
  console.log('✓ [ImageWorkspace.tsx] Removed auto-fill from carousel card click');
}

// C. Remove auto-fill in tool switcher flyout click
const oldSwitcherClick = `                              if (tool.id === 'precise-edit') {
                                setMode('edit');
                                if (!sourceImage && assets.length > 0) {
                                  setSourceImage(assets[0].url);
                                }
                              } else {`;

const newSwitcherClick = `                              if (tool.id === 'precise-edit') {
                                setMode('edit');
                              } else {`;

if (tsx.includes(oldSwitcherClick)) {
  tsx = tsx.replace(oldSwitcherClick, newSwitcherClick);
  console.log('✓ [ImageWorkspace.tsx] Removed auto-fill from tool switcher flyout click');
}

// D. Replace Precise Edit form in ImageWorkspace.tsx with Ideogram layout
const oldPreciseFormRegex = /\/\* SMART EDIT CONTROLS \*\/[\s\S]*?<form id="ideogram-precise-edit-controls"[\s\S]*?<\/form>/m;

const newPreciseForm = `/* SMART EDIT / PRECISE EDIT CONTROLS (IDEOGRAM MATCH) */
            <form id="ideogram-precise-edit-controls" onSubmit={handleEditSubmit} className="space-y-4">
              <!-- 1. SOURCE IMAGE (IDEOGRAM MINIMALIST DROPZONE & PROPORTIONAL PREVIEW) -->
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 block mb-2">Image</label>

                <input
                  type="file"
                  ref={preciseInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setSourceImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {!sourceImage ? (
                  /* Empty State Dropzone */
                  <div
                    id="studio-precise-edit-dropzone"
                    onClick={() => preciseInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreciseDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreciseDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreciseDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setSourceImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={\`relative w-full aspect-[4/3] max-h-[380px] rounded-2xl border-2 border-dashed bg-transparent transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none \${
                      isPreciseDragging
                        ? 'border-neutral-400 dark:border-neutral-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }\`}
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 font-normal">Upload or choose an image</span>
                    <button
                      type="button"
                      id="studio-precise-edit-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        preciseInputRef.current?.click();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                ) : (
                  /* Uploaded Image Preview (Filled State) */
                  <div
                    id="studio-precise-edit-preview-wrap"
                    className="relative w-full aspect-[4/3] max-h-[380px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center p-2 group"
                  >
                    <img id="studio-precise-edit-thumb" src={sourceImage} alt="Source for Precise Edit" className="w-full h-full object-contain rounded-xl transition-all" />
                    <button
                      type="button"
                      id="studio-precise-edit-remove-src-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSourceImage(null);
                        if (preciseInputRef.current) preciseInputRef.current.value = '';
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md"
                      title="Change image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Edit Prompt Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">What should change?</label>
                <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/70 transition-all">
                  <textarea
                    id="studio-precise-edit-input"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe the change you want..."
                    rows={4}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Quality & Variations Dropdown Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Quality Dropdown */}
                <div className="relative" id="studio-precise-weight-wrapper">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Quality</label>
                  <button
                    id="studio-precise-edit-weight-btn"
                    type="button"
                    onClick={() => {
                      setIsQualityOpen(!isQualityOpen);
                      setIsPreciseCountOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span id="studio-precise-edit-weight-icon" className="shrink-0 flex items-center justify-center text-blue-500">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                        </svg>
                      </span>
                      <span id="studio-precise-edit-weight-label" className="font-medium truncate capitalize">{quality}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {isQualityOpen && (
                    <div
                      id="studio-precise-edit-weight-dropdown"
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll"
                    >
                      <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">Quality</div>
                      <div className="space-y-0.5">
                        {(['low', 'medium', 'high'] as const).map((q) => (
                          <button
                            key={q}
                            type="button"
                            data-weight={q}
                            onClick={() => {
                              setQuality(q);
                              setIsQualityOpen(false);
                            }}
                            className={\`studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left group \${
                              quality === q ? 'bg-slate-100/70 dark:bg-white/10 font-semibold text-slate-800 dark:text-slate-100' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }\`}
                          >
                            <span className="capitalize">{q}</span>
                            {quality === q && (
                              <svg className="studio-precise-weight-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variations Dropdown */}
                <div className="relative" id="studio-precise-count-wrapper">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Variations</label>
                  <button
                    id="studio-precise-edit-count-btn"
                    type="button"
                    onClick={() => {
                      setIsPreciseCountOpen(!isPreciseCountOpen);
                      setIsQualityOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span id="studio-precise-edit-count-icon" className="shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </span>
                      <span id="studio-precise-edit-count-label" className="font-medium truncate">{preciseCount} ({preciseCount} image{preciseCount > 1 ? 's' : ''})</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {isPreciseCountOpen && (
                    <div
                      id="studio-precise-edit-count-dropdown"
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll"
                    >
                      <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">Variations</div>
                      <div className="space-y-0.5">
                        {[1, 2, 3, 4].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => {
                              setPreciseCount(cnt);
                              setIsPreciseCountOpen(false);
                            }}
                            className={\`studio-precise-count-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left group \${
                              preciseCount === cnt ? 'bg-slate-100/70 dark:bg-white/10 font-semibold text-slate-800 dark:text-slate-100' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }\`}
                          >
                            <span>{cnt} ({cnt} image{cnt > 1 ? 's' : ''})</span>
                            {preciseCount === cnt && (
                              <svg className="studio-precise-count-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Apply Edit Action Button */}
              <div className="pt-2">
                <button
                  id="studio-apply-precise-edit-btn"
                  type="submit"
                  disabled={!sourceImage}
                  className={\`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 \${
                    sourceImage
                      ? 'cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  }\`}
                >
                  <span id="studio-apply-precise-edit-text">Apply edit</span>
                </button>
              </div>
            </form>`;

if (oldPreciseFormRegex.test(tsx)) {
  tsx = tsx.replace(oldPreciseFormRegex, newPreciseForm);
  console.log('✓ [ImageWorkspace.tsx] Replaced Precise Edit form with Ideogram dropzone & proportional preview');
} else {
  console.error('✗ [ImageWorkspace.tsx] oldPreciseFormRegex not found');
}

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf8');
console.log('✓ Saved src/components/ImageWorkspace.tsx successfully!\n');

