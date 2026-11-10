const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf-8');

// Target 1: Layout container width and padding
const targetContainer = '<div class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 pb-12 flex flex-col gap-10 relative z-10">';
const newContainer = '<div class="flex-1 w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-10 sm:pt-14 pb-16 flex flex-col gap-10 relative z-10">';

console.log('Target container found:', content.includes(targetContainer));

// Target 2: Headings and subtitles
const targetHeadings = `                <!-- Recent Creations Section -->
                <div class="w-full flex flex-col gap-3.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <h2 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Creations</h2>
                            <span id="image-home-recent-count" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">0</span>
                        </div>
                        <button type="button" id="image-home-view-all-btn" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all in Workspace</button>
                    </div>
                    <!-- Recent Creations Grid / Empty State -->
                    <div id="image-home-recent-grid" class="w-full">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Design Templates Section -->
                <div class="w-full flex flex-col gap-3.5 pb-12">
                    <div class="flex flex-col gap-0.5">
                        <h2 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">Design Templates & Styles</h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Curated aesthetic styles and prompts ready for generation and smart editing.</p>
                    </div>
                    <!-- Templates Grid -->
                    <div id="image-home-templates-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <!-- Dynamically populated with 3 quick action buttons on each -->
                    </div>
                </div>`;

console.log('Target headings found:', content.includes(targetHeadings));

// Target 3: renderImageHomeCreations start to end
const creationsStart = content.indexOf('function renderImageHomeCreations()');
const creationsEnd = content.indexOf('function renderImageHomeTemplates()');
console.log('creationsStart:', creationsStart, 'creationsEnd:', creationsEnd);

// Target 4: renderImageHomeTemplates start to end
const templatesStart = creationsEnd;
const templatesEnd = content.indexOf('// Aspect Ratio & Model Popovers', templatesStart);
console.log('templatesStart:', templatesStart, 'templatesEnd:', templatesEnd);

