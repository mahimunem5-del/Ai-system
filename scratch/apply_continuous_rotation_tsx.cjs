const fs = require('fs');

const tsxPath = 'src/components/ImageWorkspace.tsx';
let tsx = fs.readFileSync(tsxPath, 'utf8');

// 1. Update useEffect in ImageWorkspace.tsx
const oldEffect = `  useEffect(() => {
    if (view !== 'home' || prompt.length > 0 || isFocused) return;
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
  }, [view, placeholderIndex, prompt, isFocused]);`;

const newEffect = `  useEffect(() => {
    // Only pause or clear rotation if the user has typed text
    if (view !== 'home' || prompt.trim().length > 0) return;
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
  }, [view, placeholderIndex, Boolean(prompt.trim())]);`;

if (!tsx.includes(oldEffect)) {
  console.error('Could not find oldEffect in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(oldEffect, newEffect);
console.log('✓ Continuous rotation useEffect updated in ImageWorkspace.tsx');

// 2. Update textarea onFocus and overlay in ImageWorkspace.tsx
const oldOverlayAndTextarea = `                {/* 1. Synchronized Rotating Placeholder (Sits directly underneath with exact identical CSS & vertical alignment) */}
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
                  }}`;

const newOverlayAndTextarea = `                {/* 1. Synchronized Rotating Placeholder (Sits directly underneath with exact identical CSS & vertical alignment) */}
                <div
                  className={\`pointer-events-none absolute left-0 top-0 w-full h-full flex items-center select-none text-sm sm:text-[15px] font-normal leading-relaxed text-slate-400 dark:text-neutral-500 m-0 p-0 transition-opacity duration-200 z-0 \${
                    prompt.trim().length > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
                  }}`;

if (!tsx.includes(oldOverlayAndTextarea)) {
  console.error('Could not find oldOverlayAndTextarea in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(oldOverlayAndTextarea, newOverlayAndTextarea);
console.log('✓ Continuous rotation onFocus and overlay updated in ImageWorkspace.tsx');

fs.writeFileSync(tsxPath, tsx, 'utf8');
console.log('Successfully updated ImageWorkspace.tsx!');

