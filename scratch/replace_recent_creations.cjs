const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Replace Recent Creations section with Creative Workflows Carousel
const oldRecentSection = `                <!-- Recent Creations Section -->
                <div class="w-full flex flex-col gap-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Recent Creations</h2>
                            <span id="image-home-recent-count" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">0</span>
                        </div>
                        <button type="button" id="image-home-view-all-btn" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all in Workspace</button>
                    </div>
                    <!-- Recent Creations Grid / Empty State -->
                    <div id="image-home-recent-grid" class="w-full">
                        <!-- Dynamically populated -->
                    </div>
                </div>`;

const newWorkflowsSection = `                <!-- Creative Workflows Carousel Section (Ideogram Style 6 Premium Tools) -->
                <div class="w-full flex flex-col gap-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Creative Workflows</h2>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" id="workflow-scroll-left" class="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer select-none" title="Scroll left">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m15 18-6-6 6-6"/>
                                </svg>
                            </button>
                            <button type="button" id="workflow-scroll-right" class="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer select-none" title="Scroll right">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m9 18 6-6-6-6"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- 6 Widescreen Cards Horizontal Carousel (~260px width, ~160px height) -->
                    <div id="creative-workflows-carousel" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2">
                        
                        <!-- Card 1: Generate Image -->
                        <div class="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none" data-workflow-tool="generate-image">
                            <div class="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Generate Image" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Floating Glassmorphic Prompt Pill -->
                                <div class="absolute top-3 left-3 right-3 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] flex items-center justify-between border border-white/10 shadow-xs">
                                    <span class="truncate font-medium">Psychedelic neon portrait, cosmic swirls</span>
                                    <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center ml-1.5 shrink-0 text-[10px] font-bold">↑</span>
                                </div>
                                <!-- Bottom-Left Badge -->
                                <div class="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                        <circle cx="9" cy="9" r="2"/>
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Generate Image</span>
                        </div>

                        <!-- Card 2: Remove Background -->
                        <div class="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none" data-workflow-tool="remove-background">
                            <div class="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <!-- Split-Visual: Left Subject / Right Transparent Checkerboard Pattern -->
                                <div class="absolute inset-0 flex">
                                    <!-- Left half: Subject on solid background -->
                                    <div class="w-1/2 h-full overflow-hidden relative">
                                        <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" alt="Original subject" class="w-[260px] max-w-none h-full object-cover">
                                    </div>
                                    <!-- Right half: Transparent checkerboard with isolated subject cutout -->
                                    <div class="w-1/2 h-full overflow-hidden relative bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] dark:bg-[linear-gradient(45deg,#2a2a2a_25%,transparent_25%),linear-gradient(-45deg,#2a2a2a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#2a2a2a_75%),linear-gradient(-45deg,transparent_75%,#2a2a2a_75%)] bg-[size:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px]">
                                        <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" alt="Cutout" class="w-[260px] max-w-none h-full object-cover -translate-x-1/2">
                                    </div>
                                    <!-- Split Divider Line -->
                                    <div class="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-white/70 dark:bg-white/50 shadow-sm z-10"></div>
                                </div>
                                <!-- Bottom-Left Badge (Cutout/Eraser Icon) -->
                                <div class="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                                        <path d="M22 21H7"/>
                                        <path d="m5 11 9 9"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Remove Background</span>
                        </div>

                        <!-- Card 3: Precise Edit -->
                        <div class="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none" data-workflow-tool="precise-edit">
                            <div class="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" alt="Precise Edit" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Glowing Editing Marquee Overlay -->
                                <div class="absolute inset-x-8 inset-y-5 border-2 border-dashed border-blue-400/90 rounded-lg shadow-[0_0_14px_rgba(59,130,246,0.5)] flex items-center justify-center pointer-events-none">
                                    <span class="w-2 h-2 bg-blue-500 rounded-xs border border-white absolute -top-1 -left-1"></span>
                                    <span class="w-2 h-2 bg-blue-500 rounded-xs border border-white absolute -top-1 -right-1"></span>
                                    <span class="w-2 h-2 bg-blue-500 rounded-xs border border-white absolute -bottom-1 -left-1"></span>
                                    <span class="w-2 h-2 bg-blue-500 rounded-xs border border-white absolute -bottom-1 -right-1"></span>
                                </div>
                                <!-- Bottom-Left Badge (Edit/Cursor Icon) -->
                                <div class="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                                        <path d="m13 13 6 6"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Precise Edit</span>
                        </div>

                        <!-- Card 4: Upscale Image -->
                        <div class="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none" data-workflow-tool="upscale-image">
                            <div class="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <!-- Split Comparison: Low-Res Pixelated Left / Crisp 4K Right -->
                                <div class="absolute inset-0 flex">
                                    <div class="w-1/2 h-full overflow-hidden relative">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" alt="Low-res" class="w-[260px] max-w-none h-full object-cover blur-[2.5px] contrast-[85%]">
                                    </div>
                                    <div class="w-1/2 h-full overflow-hidden relative">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" alt="Sharp 4K" class="w-[260px] max-w-none h-full object-cover -translate-x-1/2 contrast-[105%] saturate-[105%]">
                                    </div>
                                    <div class="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-white/70 dark:bg-white/50 shadow-sm z-10"></div>
                                </div>
                                <!-- Floating 4K Badge -->
                                <div class="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-xs z-20">
                                    4K / 2x
                                </div>
                                <!-- Bottom-Left Badge (Upscale Double Chevron) -->
                                <div class="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="17 11 12 6 7 11"/>
                                        <polyline points="17 18 12 13 7 18"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Upscale Image</span>
                        </div>

                        <!-- Card 5: Image to Image -->
                        <div class="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none" data-workflow-tool="image-to-image">
                            <div class="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" alt="Image to Image" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Stylized Offset Source Reference Thumbnail -->
                                <div class="absolute top-3 right-3 w-16 h-12 rounded-lg overflow-hidden border border-white/20 shadow-lg -rotate-3 group-hover:rotate-0 transition-transform">
                                    <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=200&q=80" alt="Source" class="w-full h-full object-cover">
                                </div>
                                <!-- Bottom-Left Badge (Remix Layers Icon) -->
                                <div class="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m16 3 4 4-4 4"/>
                                        <path d="M20 7H4"/>
                                        <path d="m8 21-4-4 4-4"/>
                                        <path d="M4 17h16"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Image to Image</span>
                        </div>

                        <!-- Card 6: Vector Illustration -->
                        <div class="workflow-carousel-card flex flex-col gap-2 shrink-0 group cursor-pointer select-none" data-workflow-tool="vector-illustration">
                            <div class="w-[260px] h-[160px] rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80" alt="Vector Illustration" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Top-Right Blue NEW Badge -->
                                <div class="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-xs z-20">
                                    NEW
                                </div>
                                <!-- Bottom-Left Badge (Vector Pen Anchor Icon) -->
                                <div class="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white shadow-xs z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m12 19 7-7 3 3-7 7-3-3z"/>
                                        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                                        <path d="m2 2 7.586 7.586"/>
                                        <circle cx="11" cy="11" r="2"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Vector Illustration</span>
                        </div>

                    </div>
                </div>`;

if (!html.includes(oldRecentSection)) {
  console.error('Could not find oldRecentSection in index.html');
  process.exit(1);
}
html = html.replace(oldRecentSection, newWorkflowsSection);
console.log('✓ Successfully replaced Recent Creations with Creative Workflows carousel in index.html');

fs.writeFileSync(htmlPath, html, 'utf8');

