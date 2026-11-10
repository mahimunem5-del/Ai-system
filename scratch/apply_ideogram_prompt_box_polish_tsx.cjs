const fs = require('fs');

let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

// Add placeholders array and rotating state to ImageWorkspace component
if (!tsx.includes('const IDEOGRAM_ROTATING_PLACEHOLDERS = [')) {
  const compStart = 'export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({';
  const stateInjection = `const IDEOGRAM_ROTATING_PLACEHOLDERS = [
  "An origami crane made of world-map paper, clean studio lighting.",
  "A cartoon mascot of a hot chili pepper wearing a chef hat.",
  "Packaging for organic granola in kraft paper box with botanical illustration.",
  "A 35mm film photo of friends laughing around a campfire at dusk.",
  "A simple infographic showing the water cycle with labeled arrows.",
  "Retro-futuristic sci-fi cityscape with floating monorails, sunset glow.",
  "A cozy ceramic mug of matcha latte with delicate leaf foam art.",
  "Minimalist line-art poster of a Bauhaus architectural chair."
];\n\n` + compStart;

  tsx = tsx.replace(compStart, stateInjection);

  // Add state hooks
  const stateHookTarget = "const [isHomeModelOpen, setIsHomeModelOpen] = useState(false);";
  const stateHookAddition = `const [isHomeModelOpen, setIsHomeModelOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
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

  tsx = tsx.replace(stateHookTarget, stateHookAddition);
  console.log('✓ Injected rotating placeholder state and timer in ImageWorkspace.tsx');
}

// Update the Prompt Box JSX in ImageWorkspace.tsx
const oldBoxTarget = `<div className="w-full bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-4 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[160px]">
              
              {/* Reference Image Slots */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="file"
                  id="react-home-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setHomeRefImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div
                  onClick={() => document.getElementById('react-home-file-input')?.click()}
                  className="relative w-10 h-10 rounded-xl bg-slate-100/90 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 flex items-center justify-center cursor-pointer transition-all group/ref overflow-hidden"
                  title="Add reference image"
                >
                  {homeRefImage ? (
                    <div className="relative w-full h-full rounded-[10px] overflow-hidden">
                      <img src={homeRefImage} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setHomeRefImage(null);
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover/ref:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </div>

                {/* Ghost Slot */}
                <div
                  onClick={() => document.getElementById('react-home-file-input')?.click()}
                  className="w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-white/[0.03] border border-dashed border-slate-200/60 dark:border-white/5 flex items-center justify-center transition-all cursor-pointer opacity-70 hover:opacity-100"
                  title="Add reference image"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative flex-1 min-h-[56px] w-full">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      setView('workspace');
                      onGenerate?.({ prompt: prompt.trim(), model: selectedModel, aspectRatio, count: variationsCount, referenceImage: homeRefImage || undefined });
                    }
                  }}
                  rows={2}
                  placeholder="Describe what you want to create in vivid detail..."
                  className="w-full bg-transparent resize-none border-0 p-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 leading-relaxed font-normal"
                  autoFocus
                />
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between pt-2 mt-auto">`;

const newBox = `<div className="w-full bg-white dark:bg-[#202020] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)] p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[185px] sm:min-h-[195px]">
              
              {/* Top-Left: Reference Image Slots (Frosted Glass with Periodic Shimmer Glow) */}
              <div className="flex items-center gap-2.5 mb-4">
                <input
                  type="file"
                  id="react-home-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setHomeRefImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div
                  onClick={() => document.getElementById('react-home-file-input')?.click()}
                  className="relative w-11 h-11 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-center cursor-pointer transition-all duration-300 group/ref overflow-hidden animate-ref-shimmer"
                  title="Add reference image"
                >
                  {homeRefImage ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                      <img src={homeRefImage} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setHomeRefImage(null);
                        }}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] hover:bg-black transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400 dark:text-neutral-400 group-hover/ref:text-slate-700 dark:group-hover/ref:text-white group-hover/ref:scale-110 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </div>

                {/* Ghost Slot */}
                <div
                  onClick={() => document.getElementById('react-home-file-input')?.click()}
                  className="w-11 h-11 rounded-2xl bg-neutral-100/30 dark:bg-neutral-800/20 backdrop-blur-sm border border-dashed border-neutral-200/40 dark:border-neutral-700/30 flex items-center justify-center transition-all cursor-pointer opacity-60 hover:opacity-100"
                  title="Add reference image"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Center: Textarea with Vertically Balanced Dynamic Rotating Placeholder */}
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
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between pt-3 mt-auto">`;

if (tsx.includes(oldBoxTarget)) {
  tsx = tsx.replace(oldBoxTarget, newBox);
  console.log('✓ Updated Prompt Box JSX in ImageWorkspace.tsx');
} else {
  throw new Error('oldBoxTarget not found in ImageWorkspace.tsx');
}

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf-8');
console.log('Successfully wrote updated ImageWorkspace.tsx');

