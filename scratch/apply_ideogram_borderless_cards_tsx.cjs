const fs = require('fs');

let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

// 1. Container width and padding
const oldContainer = '<div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 pb-12 flex flex-col gap-10 relative z-10">';
const newContainer = '<div className="flex-1 w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-10 sm:pt-14 pb-16 flex flex-col gap-10 relative z-10">';

if (!tsx.includes(oldContainer)) {
  throw new Error('Container target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldContainer, newContainer);
console.log('✓ Updated ImageWorkspace.tsx container to left-aligned full width');

// 2. Heading typography
const oldHeading = '<h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Creations</h2>';
const newHeading = '<h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Recent Creations</h2>';

if (!tsx.includes(oldHeading)) {
  throw new Error('Heading target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldHeading, newHeading);
console.log('✓ Updated ImageWorkspace.tsx heading typography');

// 3. Grid & Cards
const oldGridTarget = `<div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="group relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121924] shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col">
                    <div className="relative w-full aspect-square bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 z-20">
                        <p className="text-xs text-white line-clamp-2 mb-2">{asset.prompt}</p>
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/20">
                          <button
                            type="button"
                            onClick={() => {
                              setSourceImage(asset.url);
                              setMode('edit');
                              setView('workspace');
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-blue-600 text-white text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Edit
                          </button>
                          <a
                            href={asset.url}
                            download="artwork.jpg"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white text-[11px] font-medium flex items-center justify-center cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                          </a>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(asset.prompt)}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white text-[11px] font-medium flex items-center justify-center cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>`;

const newGrid = `<div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setPrompt(asset.prompt);
                    }}
                    className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-[#1f1f1f] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer select-none"
                  >
                    <div className="relative w-full h-full aspect-square bg-slate-100 dark:bg-[#1f1f1f] overflow-hidden rounded-2xl">
                      <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      
                      {/* Smooth Subtle Dark Gradient Hover Overlay (Revealed ONLY on mouse hover) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20 pointer-events-none group-hover:pointer-events-auto">
                        {/* Top Corners Glassmorphism Badges (Shown ONLY on Hover) */}
                        <div className="flex items-center justify-between w-full pointer-events-none">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/40 backdrop-blur-md text-white/95 border border-white/10 shadow-xs">
                            {asset.aspectRatio || '1:1'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/40 backdrop-blur-md text-white/90 border border-white/10 shadow-xs max-w-[130px] truncate">
                            {asset.model || 'GPT Image 2.5'}
                          </span>
                        </div>

                        {/* Bottom Floating Prompt Preview & Quick Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-white line-clamp-2 font-normal drop-shadow-xs leading-snug">{asset.prompt}</p>
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/15">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSourceImage(asset.url);
                                setMode('edit');
                                setView('workspace');
                              }}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-blue-600 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center gap-1 cursor-pointer"
                              title="Edit with Smart Edit"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
                                <path d="m14 7 3 3" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <a
                              href={asset.url}
                              download="artwork.jpg"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center cursor-pointer"
                              title="Download image"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard?.writeText(asset.prompt);
                              }}
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-medium transition-all backdrop-blur-md flex items-center justify-center cursor-pointer"
                              title="Copy prompt"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>`;

if (!tsx.includes(oldGridTarget)) {
  throw new Error('Grid target not found in ImageWorkspace.tsx');
}
tsx = tsx.replace(oldGridTarget, newGrid);
console.log('✓ Updated ImageWorkspace.tsx cards and hover overlay');

fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf-8');
console.log('Successfully wrote updated ImageWorkspace.tsx');

