const fs = require('fs');

let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

// 1. Update hero section max-width
const oldHeroWrapper = '<div className="w-full max-w-[720px] mx-auto flex flex-col items-center">';
const newHeroWrapper = '<div className="w-full max-w-3xl sm:max-w-[760px] mx-auto flex flex-col items-center">';

if (!tsx.includes(oldHeroWrapper)) {
  throw new Error('oldHeroWrapper target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldHeroWrapper, newHeroWrapper);
console.log('✓ Updated hero section wrapper in ImageWorkspace.tsx');

// 2. Update prompt box dimensions to rounded-3xl & min-h-[195px] sm:min-h-[205px]
const oldBoxClass = 'className="w-full bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[185px] sm:min-h-[195px]"';
const newBoxClass = 'className="w-full bg-white dark:bg-[#202020] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[195px] sm:min-h-[205px]"';

if (!tsx.includes(oldBoxClass)) {
  throw new Error('oldBoxClass target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldBoxClass, newBoxClass);
console.log('✓ Updated prompt box dimensions in ImageWorkspace.tsx');

// 3. Update React Word-by-Word streaming state and effect
const oldStateBlock = `  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderEntering, setIsPlaceholderEntering] = useState(false);

  useEffect(() => {
    if (view !== 'home') return;
    const interval = setInterval(() => {
      setIsPlaceholderEntering(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % IDEOGRAM_ROTATING_PLACEHOLDERS.length);
        setIsPlaceholderEntering(false);
      }, 250);
    }, 4500);
    return () => clearInterval(interval);
  }, [view]);`;

const newStateBlock = `  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (view !== 'home' || prompt.trim()) return;
    let wordTimer: NodeJS.Timeout | null = null;
    let holdTimer: NodeJS.Timeout | null = null;
    let fadeTimer: NodeJS.Timeout | null = null;

    const phrase = IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex] || '';
    const words = phrase.split(' ');
    let currentWord = 0;

    setDisplayedPlaceholder('');
    setIsTabVisible(false);
    setIsFadingOut(false);

    const streamNext = () => {
      if (currentWord < words.length) {
        currentWord++;
        setDisplayedPlaceholder(words.slice(0, currentWord).join(' '));
        wordTimer = setTimeout(streamNext, 48);
      } else {
        setIsTabVisible(true);
        holdTimer = setTimeout(() => {
          setIsFadingOut(true);
          fadeTimer = setTimeout(() => {
            setPlaceholderIndex((prev) => (prev + 1) % IDEOGRAM_ROTATING_PLACEHOLDERS.length);
          }, 260);
        }, 4000);
      }
    };

    streamNext();

    return () => {
      if (wordTimer) clearTimeout(wordTimer);
      if (holdTimer) clearTimeout(holdTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [view, placeholderIndex, prompt]);`;

if (!tsx.includes(oldStateBlock)) {
  throw new Error('oldStateBlock target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldStateBlock, newStateBlock);
console.log('✓ Updated word-by-word streaming state in ImageWorkspace.tsx');

// 4. Update the input wrapper and textarea JSX in ImageWorkspace.tsx
const oldInputJsx = `              {/* Center: Textarea with Vertically Balanced Dynamic Rotating Placeholder */}
              <div className="relative flex-1 w-full my-auto flex flex-col justify-center min-h-[58px] cursor-text">
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
                  rows={2}
                  className="w-full bg-transparent resize-none border-0 p-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed font-normal my-auto relative z-10"
                  autoFocus
                />

                {!prompt.trim() && (
                  <div
                    onClick={() => {
                      setPrompt(IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]);
                    }}
                    className="absolute inset-0 pointer-events-none flex items-center text-sm sm:text-[15px] text-slate-400 dark:text-slate-500 leading-relaxed select-none z-0"
                  >
                    <div
                      className={\`flex items-center flex-wrap gap-2 w-full transition-all duration-300 transform \${
                        isPlaceholderEntering
                          ? 'opacity-0 translate-x-3'
                          : 'opacity-100 translate-x-0'
                      }\`}
                    >
                      <span className="line-clamp-2">{IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-400 shrink-0 select-none uppercase tracking-wider">Tab</span>
                    </div>
                  </div>
                )}
              </div>`;

const newInputJsx = `              {/* Center: Textarea with Synchronized Overlay Stack & Word-by-Word Typewriter Placeholder */}
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

if (!tsx.includes(oldInputJsx)) {
  throw new Error('oldInputJsx target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldInputJsx, newInputJsx);
console.log('✓ Updated input and placeholder synchronized overlay stack in ImageWorkspace.tsx');

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf-8');
console.log('Successfully wrote ImageWorkspace.tsx');

