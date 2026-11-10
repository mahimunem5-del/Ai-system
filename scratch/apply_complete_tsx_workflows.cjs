const fs = require('fs');

const tsxPath = 'src/components/ImageWorkspace.tsx';
let tsx = fs.readFileSync(tsxPath, 'utf8');

// 1. Replace the entire "Recent Creations" block in Image Home with Creative Workflows carousel
const recentStart = '          {/* Recent Creations */}';
const homeEndTarget = '        </div>\n      </div>\n    );\n  }\n\n  return (';
const recentBlockIdx = tsx.indexOf(recentStart);
const homeEndIdx = tsx.indexOf(homeEndTarget);

if (recentBlockIdx === -1 || homeEndIdx === -1) {
  console.error('Could not find boundaries for Recent Creations block in ImageWorkspace.tsx');
  process.exit(1);
}

const carouselReplacement = `          {/* Creative Workflows Carousel */}
          <div className="w-full flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Creative Workflows</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">6 Tools</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="workflow-scroll-left"
                  onClick={() => {
                    document.getElementById('creative-workflows-carousel')?.scrollBy({ left: -300, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="Scroll left"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  id="workflow-scroll-right"
                  onClick={() => {
                    document.getElementById('creative-workflows-carousel')?.scrollBy({ left: 300, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="Scroll right"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Carousel */}
            <div id="creative-workflows-carousel" className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2">
              
              {/* Card 1: Generate Image */}
              <div
                className="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('generate-image');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Generate Image" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 right-3 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] flex items-center justify-between border border-white/10 shadow-xs">
                    <span className="truncate font-medium">Psychedelic neon portrait, cosmic swirls</span>
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center ml-1.5 shrink-0 text-[10px] font-bold">↑</span>
                  </div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Generate Image</span>
              </div>

              {/* Card 2: Remove Background */}
              <div
                className="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('remove-background');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <div className="absolute inset-0 grid grid-cols-2">
                    <div className="relative overflow-hidden bg-slate-800">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Original Subject" className="absolute inset-0 w-[260px] h-[160px] object-cover" />
                    </div>
                    <div className="relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] bg-slate-100 dark:bg-neutral-900">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Cutout Preview" className="absolute -left-[130px] inset-y-0 w-[260px] h-[160px] object-cover" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }} />
                    </div>
                  </div>
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Remove Background</span>
              </div>

              {/* Card 3: Precise Edit */}
              <div
                className="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('precise-edit');
                  setMode('edit');
                  if (!sourceImage && assets.length > 0) {
                    setSourceImage(assets[0].url);
                  }
                  setView('workspace');
                }}
              >
                <div className="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" alt="Precise Edit" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-6 left-12 right-12 bottom-8 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 text-[10px] font-mono tracking-wider backdrop-blur-sm">MARQUEE EDIT</span>
                  </div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" strokeDasharray="3 3"/>
                      <path d="m14 14 3 3m0-3-3 3"/>
                      <circle cx="9" cy="9" r="2"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Precise Edit</span>
              </div>

              {/* Card 4: Upscale Image */}
              <div
                className="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('upscale-image');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <div className="absolute inset-0 grid grid-cols-2">
                    <div className="relative overflow-hidden bg-slate-800">
                      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=40" alt="Standard Res" className="absolute inset-0 w-[260px] h-[160px] object-cover blur-[2px] opacity-80" />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 text-[9px] font-mono">1X</div>
                    </div>
                    <div className="relative overflow-hidden bg-slate-900">
                      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=100" alt="Super Res" className="absolute -left-[130px] inset-y-0 w-[260px] h-[160px] object-cover saturate-110 contrast-105" />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold">4K UHD</div>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 15 5-5 5 5"/><path d="m7 9 5-5 5 5"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Upscale Image</span>
              </div>

              {/* Card 5: Image to Image */}
              <div
                className="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('image-to-image');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" alt="Image to Image" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute bottom-3 right-3 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/80 shadow-lg -rotate-6 group-hover:rotate-0 transition-transform">
                    <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=200&q=80" alt="Style Guide" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="2" y="2" rx="2"/><rect width="14" height="14" x="8" y="8" rx="2"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Image to Image</span>
              </div>

              {/* Card 6: Vector Illustration */}
              <div
                className="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('vector-illustration');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Vector Art" className="w-full h-full object-cover saturate-150 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-md">
                    NEW
                  </div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Vector Illustration</span>
              </div>

            </div>
          </div>
`;

tsx = tsx.substring(0, recentBlockIdx) + carouselReplacement + tsx.substring(homeEndIdx);
console.log('✓ Replaced Recent Creations with Creative Workflows carousel in ImageWorkspace.tsx');

// 2. Replace Workspace Header with Ideogram App Switcher Dropdown
const oldHeaderPattern = `        {/* Panel Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-transparent border-b border-gray-100 dark:border-neutral-800/60">
          {mode === 'generate' ? (
            <div id="ideogram-header-generate" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              <button
                type="button"
                id="ideogram-back-to-home-btn"
                onClick={() => setView('home')}
                className="p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Back to Image Home"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span>Generate Image</span>
            </div>
          ) : (
            <div id="ideogram-header-edit" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              <button
                type="button"
                id="ideogram-edit-back-btn"
                onClick={() => setMode('generate')}
                className="p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                title="Back to Generate Image"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span>Smart Edit</span>
            </div>
          )}`;

const newHeaderContent = `        {/* Panel Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-transparent border-b border-gray-100 dark:border-neutral-800/60">
          <div id="ideogram-header-generate" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white relative">
            <button
              type="button"
              id="ideogram-back-to-home-btn"
              onClick={() => setView('home')}
              className="p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1"
              title="Back to Image Home"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Ideogram-Style Breadcrumb App Switcher Dropdown */}
            <div className="relative" id="workspace-tool-switcher-wrapper" ref={toolSwitcherRef}>
              <button
                type="button"
                id="workspace-tool-switcher-btn"
                onClick={() => setIsToolSwitcherOpen(!isToolSwitcherOpen)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-2 py-1.5 rounded-lg transition cursor-pointer select-none"
              >
                <span className="text-neutral-400 dark:text-neutral-500 font-normal hidden sm:inline">Creative Workflows /</span>
                <span id="workspace-active-tool-label">
                  {WORKFLOW_TOOLS_CONFIG.find(t => t.id === workflowTool)?.label || 'Generate Image'}
                </span>
                <svg
                  className={\`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 \${isToolSwitcherOpen ? 'rotate-180' : ''}\`}
                  id="workspace-tool-switcher-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Searchable Popup Menu (Flyout) */}
              {isToolSwitcherOpen && (
                <div
                  id="workspace-tool-flyout"
                  className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl p-1.5 z-50"
                >
                  {/* Header Search Input */}
                  <div className="relative mb-1.5 px-1 pt-1">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/50 dark:border-neutral-700/50 text-slate-800 dark:text-neutral-200">
                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                      </svg>
                      <input
                        type="text"
                        value={toolSearchQuery}
                        onChange={(e) => setToolSearchQuery(e.target.value)}
                        placeholder="Search workflows..."
                        autoFocus
                        className="w-full bg-transparent text-xs placeholder:text-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tool List */}
                  <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto ideogram-custom-scroll" id="workspace-tool-list">
                    {WORKFLOW_TOOLS_CONFIG
                      .filter(tool => !toolSearchQuery.trim() || tool.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) || tool.subtitle.toLowerCase().includes(toolSearchQuery.toLowerCase()))
                      .map(tool => {
                        const isSelected = tool.id === workflowTool;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => {
                              setWorkflowTool(tool.id);
                              if (tool.id === 'precise-edit') {
                                setMode('edit');
                                if (!sourceImage && assets.length > 0) {
                                  setSourceImage(assets[0].url);
                                }
                              } else {
                                setMode('generate');
                              }
                              setIsToolSwitcherOpen(false);
                            }}
                            className={\`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition cursor-pointer \${
                              isSelected
                                ? 'bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-neutral-300'
                            }\`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={\`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 \${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                              }\`}>
                                {tool.id === 'generate-image' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                )}
                                {tool.id === 'remove-background' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
                                )}
                                {tool.id === 'precise-edit' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" strokeDasharray="3 3"/><path d="m14 14 3 3m0-3-3 3"/><circle cx="9" cy="9" r="2"/></svg>
                                )}
                                {tool.id === 'upscale-image' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5-5 5 5"/><path d="m7 9 5-5 5 5"/></svg>
                                )}
                                {tool.id === 'image-to-image' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="2" y="2" rx="2"/><rect width="14" height="14" x="8" y="8" rx="2"/></svg>
                                )}
                                {tool.id === 'vector-illustration' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                                )}
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs truncate font-medium">{tool.label}</span>
                                  {tool.badge && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                      {tool.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{tool.subtitle}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="shrink-0 ml-2 text-blue-600 dark:text-blue-400">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>`;

if (!tsx.includes(oldHeaderPattern)) {
  console.error('Could not find oldHeaderPattern in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(oldHeaderPattern, newHeaderContent);
console.log('✓ Replaced Workspace Header with Ideogram App Switcher Dropdown');

// 3. Add panels for remove-background, upscale-image, and image-to-image to Left Panel
const leftPanelTarget = `        {/* Scrollable Parameter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 ideogram-custom-scroll">
          {mode === 'generate' ? (`;

const leftPanelReplacement = `        {/* Scrollable Parameter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 ideogram-custom-scroll">
          {/* Tool-specific workflows */}
          {workflowTool === 'remove-background' ? (
            <div id="ideogram-remove-bg-controls" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Source Image</label>
                {!removeBgImage ? (
                  <label
                    id="remove-bg-upload-zone"
                    className="border-2 border-dashed border-slate-200 dark:border-neutral-800 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-white/[0.02]"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Drop image here or click to browse</span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 20MB</span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] p-2">
                    <img src={removeBgImage} alt="Remove Background Target" className="w-full max-h-[220px] object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setRemoveBgImage(null)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs cursor-pointer shadow-md"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!removeBgImage || isProcessingWorkflow}
                onClick={async () => {
                  if (!removeBgImage) return;
                  setIsProcessingWorkflow(true);
                  try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise((res, rej) => {
                      img.onload = res;
                      img.onerror = rej;
                      img.src = removeBgImage;
                    });
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(img, 0, 0);
                      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                      const data = imgData.data;
                      const w = canvas.width;
                      const h = canvas.height;
                      const bgR = (data[0] + data[(w - 1) * 4] + data[(h - 1) * w * 4]) / 3;
                      const bgG = (data[1] + data[(w - 1) * 4 + 1] + data[(h - 1) * w * 4 + 1]) / 3;
                      const bgB = (data[2] + data[(w - 1) * 4 + 2] + data[(h - 1) * w * 4 + 2]) / 3;
                      const threshold = 54;
                      for (let i = 0; i < data.length; i += 4) {
                        const dist = Math.sqrt((data[i] - bgR) ** 2 + (data[i + 1] - bgG) ** 2 + (data[i + 2] - bgB) ** 2);
                        if (dist < threshold * 0.7) data[i + 3] = 0;
                        else if (dist < threshold) data[i + 3] = Math.round(data[i + 3] * ((dist - threshold * 0.7) / (threshold * 0.3)));
                      }
                      ctx.putImageData(imgData, 0, 0);
                      const resultUrl = canvas.toDataURL('image/png');
                      assets.unshift({
                        id: 'bg-removed-' + Date.now(),
                        url: resultUrl,
                        prompt: 'Background Removed (Transparent PNG)',
                        model: 'Canvas Cutout',
                        aspectRatio: w + ':' + h
                      });
                    }
                  } catch (err) {
                    console.error('BG removal error:', err);
                  } finally {
                    setIsProcessingWorkflow(false);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <span>{isProcessingWorkflow ? 'Removing Background...' : 'Remove Background'}</span>
              </button>
            </div>
          ) : workflowTool === 'upscale-image' ? (
            <div id="ideogram-upscale-controls" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Source Image</label>
                {!upscaleImage ? (
                  <label
                    id="upscale-upload-zone"
                    className="border-2 border-dashed border-slate-200 dark:border-neutral-800 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-white/[0.02]"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setUpscaleImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Drop image here or click to browse</span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 p-2">
                    <img src={upscaleImage} alt="Upscale Target" className="w-full max-h-[220px] object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setUpscaleImage(null)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs cursor-pointer shadow-md"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Scale Factor</label>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 4].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setUpscaleFactor(scale as 2 | 4)}
                      className={\`py-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center \${
                        upscaleFactor === scale
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                      }\`}
                    >
                      {scale}x Scale
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!upscaleImage || isProcessingWorkflow}
                onClick={async () => {
                  if (!upscaleImage) return;
                  setIsProcessingWorkflow(true);
                  try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise((res, rej) => {
                      img.onload = res;
                      img.onerror = rej;
                      img.src = upscaleImage;
                    });
                    const targetW = (img.naturalWidth || img.width) * upscaleFactor;
                    const targetH = (img.naturalHeight || img.height) * upscaleFactor;
                    const canvas = document.createElement('canvas');
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.imageSmoothingEnabled = true;
                      ctx.imageSmoothingQuality = 'high';
                      ctx.drawImage(img, 0, 0, targetW, targetH);
                      const resultUrl = canvas.toDataURL('image/jpeg', 0.95);
                      assets.unshift({
                        id: 'upscaled-' + Date.now(),
                        url: resultUrl,
                        prompt: \`Upscaled \${upscaleFactor}x (\${targetW}×\${targetH})\`,
                        model: \`Super Resolution \${upscaleFactor}x\`,
                        aspectRatio: targetW + ':' + targetH
                      });
                    }
                  } catch (err) {
                    console.error('Upscale error:', err);
                  } finally {
                    setIsProcessingWorkflow(false);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <span>{isProcessingWorkflow ? \`Upscaling \${upscaleFactor}x...\` : 'Upscale Image'}</span>
              </button>
            </div>
          ) : workflowTool === 'image-to-image' ? (
            <div id="ideogram-img2img-controls" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Source Image Guide</label>
                {!img2imgImage ? (
                  <label
                    id="img2img-upload-zone"
                    className="border-2 border-dashed border-slate-200 dark:border-neutral-800 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-white/[0.02]"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setImg2imgImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Drop reference image here</span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 p-2">
                    <img src={img2imgImage} alt="Img2Img Source" className="w-full max-h-[220px] object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setImg2imgImage(null)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs cursor-pointer shadow-md"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Transformation Strength</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">{Math.round(img2imgStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={img2imgStrength}
                  onChange={(e) => setImg2imgStrength(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Variation Prompt</label>
                <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3">
                  <textarea
                    value={img2imgPrompt}
                    onChange={(e) => setImg2imgPrompt(e.target.value)}
                    placeholder="Describe how to remix this image..."
                    rows={3}
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!img2imgImage || !img2imgPrompt.trim()}
                onClick={() => {
                  if (!img2imgImage || !img2imgPrompt.trim()) return;
                  onGenerate?.({
                    prompt: img2imgPrompt.trim(),
                    model: selectedModel,
                    aspectRatio: '1:1',
                    count: 1,
                    referenceImage: img2imgImage
                  });
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <span>Generate Variations</span>
              </button>
            </div>
          ) : (mode === 'generate' && workflowTool !== 'precise-edit') ? (`;

if (!tsx.includes(leftPanelTarget)) {
  console.error('Could not find leftPanelTarget in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(leftPanelTarget, leftPanelReplacement);
console.log('✓ Added all tool workflow panels into left panel of ImageWorkspace.tsx');

// 4. Add vector banner inside ideogram-generate-controls
const vectorBannerTarget = `            /* GENERATE CONTROLS */
            <form id="ideogram-generate-controls" onSubmit={handleGenerateSubmit} className="space-y-4">`;

const vectorBannerReplacement = `            /* GENERATE CONTROLS */
            <form id="ideogram-generate-controls" onSubmit={handleGenerateSubmit} className="space-y-4">
              {workflowTool === 'vector-illustration' && (
                <div id="vector-mode-banner" className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="12 2 19 21 12 17 5 21 12 2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Vector Mode Active</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">Optimized for clean 2D flat SVG graphics & isolated icons</div>
                  </div>
                </div>
              )}`;

if (!tsx.includes(vectorBannerTarget)) {
  console.error('Could not find vectorBannerTarget in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(vectorBannerTarget, vectorBannerReplacement);
console.log('✓ Added vector banner to generate controls in ImageWorkspace.tsx');

fs.writeFileSync(tsxPath, tsx, 'utf8');
console.log('Successfully completed full ImageWorkspace.tsx update!');
