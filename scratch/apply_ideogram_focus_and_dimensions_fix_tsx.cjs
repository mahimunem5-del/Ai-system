const fs = require('fs');

let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

// 1. Add isFocused state & update streaming effect
const oldHookTarget = `  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (view !== 'home' || prompt.trim()) return;`;

const newHookBlock = `  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (view !== 'home' || prompt.trim() || isFocused) return;`;

if (!tsx.includes(oldHookTarget)) {
  throw new Error('oldHookTarget not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldHookTarget, newHookBlock);

// Also update dependency array for the effect
const oldDepTarget = '  }, [view, placeholderIndex, prompt]);';
const newDepTarget = '  }, [view, placeholderIndex, prompt, isFocused]);';
if (tsx.includes(oldDepTarget)) {
  tsx = tsx.replace(oldDepTarget, newDepTarget);
}
console.log('✓ Updated isFocused state and streaming effect in ImageWorkspace.tsx');

// 2. Update Hero wrapper to max-w-[780px]
const oldHeroTarget = '<div className="w-full max-w-3xl sm:max-w-[760px] mx-auto flex flex-col items-center">';
const newHeroTarget = '<div className="w-full max-w-[780px] mx-auto flex flex-col items-center">';
if (!tsx.includes(oldHeroTarget)) {
  throw new Error('oldHeroTarget not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldHeroTarget, newHeroTarget);
console.log('✓ Updated hero section wrapper in ImageWorkspace.tsx');

// 3. Update Box container to min-h-[220px] and frosted glass styling
const oldBoxTarget = 'className="w-full bg-white dark:bg-[#202020] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[195px] sm:min-h-[205px]"';
const newBoxTarget = 'className="w-full bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-5 sm:p-6 transition-all duration-200 focus-within:border-neutral-300 dark:focus-within:border-neutral-700 relative z-10 flex flex-col justify-between min-h-[220px]"';
if (!tsx.includes(oldBoxTarget)) {
  throw new Error('oldBoxTarget not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldBoxTarget, newBoxTarget);
console.log('✓ Updated box container styling in ImageWorkspace.tsx');

// 4. Update Row 1, Row 2, Row 3 inside Prompt Box JSX
const oldRow1Target = '<div className="flex items-center gap-2.5 mb-4">';
const newRow1Target = '<div className="flex items-center gap-2.5 shrink-0">';
if (tsx.includes(oldRow1Target)) {
  tsx = tsx.replace(oldRow1Target, newRow1Target);
}

const oldRow2Target = `              {/* Center: Textarea with Synchronized Overlay Stack & Word-by-Word Typewriter Placeholder */}
              <div className="relative flex-1 w-full min-h-[64px] cursor-text">
                {/* 1. Synchronized Rotating Placeholder (Sits directly underneath with exact identical CSS) */}
                <div
                  className={\`absolute inset-0 pointer-events-none select-none text-sm sm:text-[15px] text-slate-400 dark:text-neutral-500 font-normal leading-relaxed m-0 p-0 transition-opacity duration-200 z-0 \${
                    prompt.trim() || isFadingOut ? 'opacity-0' : 'opacity-100'
                  }\`}
                >
                  <span>{displayedPlaceholder}</span>
                  <span
                    className={\`inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider transition-opacity duration-300 align-baseline \${
                      isTabVisible ? 'opacity-100' : 'opacity-0'
                    }\`}
                  >
                    Tab
                  </span>
                </div>

                {/* 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) */}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
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
                  rows={3}
                  className="w-full h-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed font-normal relative z-10 block"
                  spellCheck={false}
                  autoFocus
                />
              </div>`;

const newRow2Target = `              {/* Row 2: Prompt Input Container (Middle - Centered with flexible growth) */}
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

if (!tsx.includes(oldRow2Target)) {
  throw new Error('oldRow2Target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldRow2Target, newRow2Target);
console.log('✓ Updated Row 2 with middle centering and focus hiding in ImageWorkspace.tsx');

const oldRow3Target = '<!-- Bottom Row -->\n              <div className="flex items-center justify-between pt-3 mt-auto">';
const newRow3Target = '<!-- Row 3: Bottom Bar -->\n              <div className="flex items-center justify-between pt-2 mt-auto shrink-0">';
if (tsx.includes(oldRow3Target)) {
  tsx = tsx.replace(oldRow3Target, newRow3Target);
}

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf-8');
console.log('Successfully wrote ImageWorkspace.tsx');

