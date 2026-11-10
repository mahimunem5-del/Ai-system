const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add CSS rules in <style> to guarantee zero scrollbar/seekbar across all engines
const styleRule = `
        /* Complete Removal of Horizontal Scrollbar / Seekbar for Workflows Carousel */
        #creative-workflows-carousel,
        .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
        }
        #creative-workflows-carousel::-webkit-scrollbar,
        .no-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            background: transparent !important;
        }
`;

const firstStyleClose = '</style>';
if (!html.includes(styleRule.trim())) {
    const stylePos = html.indexOf(firstStyleClose);
    if (stylePos !== -1) {
        html = html.substring(0, stylePos) + styleRule + '\n    ' + html.substring(stylePos);
        console.log('✓ Added zero-scrollbar CSS rules to <style>');
    }
}

// 2. Locate the Creative Workflows carousel in index.html
const sectionStart = '<!-- Creative Workflows Carousel Section (Ideogram Style 6 Premium Tools) -->';
const sectionEnd = '<!-- Design Templates Section -->';

const startIdx = html.indexOf(sectionStart);
const endIdx = html.indexOf(sectionEnd);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find Creative Workflows section boundaries in index.html');
    process.exit(1);
}

const newCarouselSection = `<!-- Creative Workflows Carousel Section (Ideogram Style 6 Premium Tools) -->
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

                    <!-- 6 Widescreen Cards Horizontal Carousel (285px width, 180px height, scrollbar-free) -->
                    <div id="creative-workflows-carousel" class="flex gap-4 sm:gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar scroll-smooth py-1 select-none">
                        
                        <!-- Card 1: Generate Image -->
                        <div class="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none" data-workflow-tool="generate-image">
                            <div class="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Generate Image" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Floating Glassmorphic Prompt Pill -->
                                <div class="absolute top-3 left-3 right-3 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] flex items-center justify-between border border-white/10 shadow-xs">
                                    <span class="truncate font-medium">Psychedelic neon portrait, cosmic swirls</span>
                                    <span class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center ml-1.5 shrink-0 text-[10px] font-bold">↑</span>
                                </div>
                                <!-- Bottom-Left Badge -->
                                <div class="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                        <circle cx="9" cy="9" r="2"/>
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Generate Image</span>
                        </div>

                        <!-- Card 2: Remove Background -->
                        <div class="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none" data-workflow-tool="remove-background">
                            <div class="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <!-- Split Visual Preview: Subject vs Transparent Checkerboard Cutout -->
                                <div class="absolute inset-0 grid grid-cols-2">
                                    <div class="relative overflow-hidden bg-slate-800">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Original Subject" class="absolute inset-0 w-[285px] h-[180px] object-cover">
                                    </div>
                                    <div class="relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] bg-slate-100 dark:bg-neutral-900">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Cutout Preview" class="absolute -left-[142.5px] inset-y-0 w-[285px] h-[180px] object-cover" style="filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));">
                                    </div>
                                </div>
                                <div class="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"></div>
                                <!-- Bottom-Left Badge (Eraser/Cutout Icon) -->
                                <div class="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                                        <path d="M22 21H7"/>
                                        <path d="m5 11 9 9"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Remove Background</span>
                        </div>

                        <!-- Card 3: Precise Edit -->
                        <div class="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none" data-workflow-tool="precise-edit">
                            <div class="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" alt="Precise Edit" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Floating Active Marquee Box -->
                                <div class="absolute top-6 left-12 right-12 bottom-8 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center pointer-events-none">
                                    <span class="px-2 py-0.5 rounded bg-black/60 text-cyan-300 text-[10px] font-mono tracking-wider backdrop-blur-sm">MARQUEE EDIT</span>
                                </div>
                                <!-- Bottom-Left Badge (Marquee Icon) -->
                                <div class="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" stroke-dasharray="3 3"/>
                                        <path d="m14 14 3 3m0-3-3 3"/>
                                        <circle cx="9" cy="9" r="2"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Precise Edit</span>
                        </div>

                        <!-- Card 4: Upscale Image -->
                        <div class="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none" data-workflow-tool="upscale-image">
                            <div class="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <!-- Split Visual Preview: Low-Res vs 4K Sharp -->
                                <div class="absolute inset-0 grid grid-cols-2">
                                    <div class="relative overflow-hidden bg-slate-800">
                                        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=40" alt="Standard Res" class="absolute inset-0 w-[285px] h-[180px] object-cover blur-[2px] opacity-80">
                                        <div class="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 text-[9px] font-mono">1X</div>
                                    </div>
                                    <div class="relative overflow-hidden bg-slate-900">
                                        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=100" alt="Super Res" class="absolute -left-[142.5px] inset-y-0 w-[285px] h-[180px] object-cover saturate-110 contrast-105">
                                        <div class="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold">4K UHD</div>
                                    </div>
                                </div>
                                <div class="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"></div>
                                <!-- Bottom-Left Badge (Double Upward Chevron Icon) -->
                                <div class="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 15 5-5 5 5"/>
                                        <path d="m7 9 5-5 5 5"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Upscale Image</span>
                        </div>

                        <!-- Card 5: Image to Image -->
                        <div class="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none" data-workflow-tool="image-to-image">
                            <div class="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" alt="Image to Image" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                <!-- Floating Style Guide Thumbnail -->
                                <div class="absolute bottom-3 right-3 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/80 shadow-lg -rotate-6 group-hover:rotate-0 transition-transform">
                                    <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=200&q=80" alt="Style Guide" class="w-full h-full object-cover">
                                </div>
                                <!-- Bottom-Left Badge (Remix Layers Icon) -->
                                <div class="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="14" height="14" x="2" y="2" rx="2"/>
                                        <rect width="14" height="14" x="8" y="8" rx="2"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Image to Image</span>
                        </div>

                        <!-- Card 6: Vector Illustration -->
                        <div class="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none" data-workflow-tool="vector-illustration">
                            <div class="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Vector Art" class="w-full h-full object-cover saturate-150 transition-transform duration-500 group-hover:scale-105">
                                <!-- Top-Right Blue NEW Badge -->
                                <div class="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-md z-20">
                                    NEW
                                </div>
                                <!-- Bottom-Left Badge (Vector Pen Anchor Icon) -->
                                <div class="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                                    </svg>
                                </div>
                            </div>
                            <span class="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Vector Illustration</span>
                        </div>

                    </div>
                </div>

                `;

html = html.substring(0, startIdx) + newCarouselSection + html.substring(endIdx);
console.log('✓ Successfully replaced Creative Workflows carousel in index.html');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully saved index.html!');

