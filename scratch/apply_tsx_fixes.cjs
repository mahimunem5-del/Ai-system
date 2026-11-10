const fs = require('fs');

const tsxPath = 'src/components/ImageWorkspace.tsx';
let tsx = fs.readFileSync(tsxPath, 'utf8');

// 1. Update useEffect condition
const oldEffectCondition = `  useEffect(() => {
    if (view !== 'home' || prompt.trim() || isFocused) return;`;

const newEffectCondition = `  useEffect(() => {
    if (view !== 'home' || prompt.length > 0 || isFocused) return;`;

if (!tsx.includes(oldEffectCondition)) {
  console.error('Could not find oldEffectCondition in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(oldEffectCondition, newEffectCondition);
console.log('✓ Effect condition updated');

// 2. Update Row 2 in ImageWorkspace.tsx
const oldRow2 = `              {/* Row 2: Prompt Input Container (Middle - Centered with flexible growth) */}
              <div className="relative flex-1 my-auto flex items-center w-full min-h-[68px] cursor-text">
                {/* 1. Synchronized Rotating Placeholder (Sits directly underneath with exact identical CSS & vertical alignment) */}
                <div
                  className={\`absolute inset-0 flex items-center pointer-events-none select-none text-sm sm:text-[15px] text-slate-400 dark:text-neutral-500 font-normal leading-relaxed m-0 p-0 transition-opacity duration-200 z-0 \${
                    prompt.trim() || isFocused || isFadingOut ? 'opacity-0' : 'opacity-100'
                  }\`}
                >
                  <span>{displayedPlaceholder}</span>
                  <span
                    className={\`inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider transition-opacity duration-300 align-baseline \${
                      isTabVisible && !isFocused && !prompt.trim() ? 'opacity-100' : 'opacity-0'
                    }\`}
                  >
                    Tab
                  </span>
                </div>

                {/* 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) */}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !prompt.trim()) {
                      e.preventDefault();
                      setPrompt(IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]);
                    } else if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      setView('workspace');
                      onGenerate?.({ prompt: prompt.trim(), model: selectedModel, aspectRatio, count: variationsCount, referenceImage: homeRefImage || undefined });
                    }
                  }}
                  rows={2}
                  className="w-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed font-normal relative z-10 block"
                  spellCheck={false}
                  autoFocus
                />
              </div>`;

const newRow2 = `              {/* Row 2: Prompt Input Container (Middle - Centered with flexible growth) */}
              <div className="relative flex-1 flex items-center w-full min-h-[68px] cursor-text">
                {/* 1. Synchronized Rotating Placeholder (Sits directly underneath with exact identical CSS & vertical alignment) */}
                <div
                  className={\`pointer-events-none absolute left-0 top-0 w-full h-full flex items-center select-none text-sm sm:text-[15px] font-normal leading-relaxed text-slate-400 dark:text-neutral-500 m-0 p-0 transition-opacity duration-200 z-0 \${
                    prompt.length > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }\`}
                >
                  <span>{displayedPlaceholder || IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]}</span>
                  <span
                    className={\`inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider transition-opacity duration-300 align-baseline \${
                      isTabVisible || isFocused ? 'opacity-100' : 'opacity-0'
                    }\`}
                  >
                    Tab
                  </span>
                </div>

                {/* 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) */}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    if (!prompt.length && !displayedPlaceholder) {
                      setDisplayedPlaceholder(IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]);
                      setIsTabVisible(true);
                    }
                  }}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !prompt.length) {
                      e.preventDefault();
                      setPrompt(IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]);
                    } else if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      setView('workspace');
                      onGenerate?.({ prompt: prompt.trim(), model: selectedModel, aspectRatio, count: variationsCount, referenceImage: homeRefImage || undefined });
                    }
                  }}
                  rows={1}
                  className="w-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] font-normal text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed block overflow-hidden relative z-10"
                  spellCheck={false}
                />
              </div>`;

if (!tsx.includes(oldRow2)) {
  console.error('Could not find oldRow2 in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(oldRow2, newRow2);
console.log('✓ Row 2 updated in ImageWorkspace.tsx');

fs.writeFileSync(tsxPath, tsx, 'utf8');
console.log('Successfully updated ImageWorkspace.tsx!');

