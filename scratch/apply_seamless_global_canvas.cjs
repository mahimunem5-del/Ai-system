const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Change body background-color in light mode from #F8FAFC to #ffffff
const oldBodyStyle = `        body {
            font-family: 'Inter', sans-serif;
            background-color: #F8FAFC;
        }`;

const newBodyStyle = `        body {
            font-family: 'Inter', sans-serif;
            background-color: #ffffff;
        }`;

if (!html.includes(oldBodyStyle)) {
  console.error('Could not find oldBodyStyle in index.html');
  process.exit(1);
}
html = html.replace(oldBodyStyle, newBodyStyle);
console.log('✓ Updated body background to #ffffff');

// 2. Update RTL sidebar border
const oldRtl = `        html[dir="rtl"] #sidebar {
            border-right: none !important;
            border-left: 1px solid #E2E8F0 !important;
        }`;

const newRtl = `        html[dir="rtl"] #sidebar {
            border-right: none !important;
            border-left: none !important;
            border-left-color: transparent !important;
        }`;

if (!html.includes(oldRtl)) {
  console.error('Could not find oldRtl in index.html');
  process.exit(1);
}
html = html.replace(oldRtl, newRtl);
console.log('✓ Updated RTL sidebar borders');

// 3. Update global dark sidebar rules around line 880
const oldDarkSidebar = `        html.dark #sidebar {
            background-color: #202020 !important;
            border-color: #2a2a2a !important;
        }

        html.dark #sidebar .bg-white {
            background-color: #202020 !important;
        }

        html.dark #sidebar .border-slate-100 {
            border-color: #2a2a2a !important;
        }`;

const newDarkSidebar = `        html.dark #sidebar {
            background-color: #191919 !important;
            border-right: none !important;
            border-right-color: transparent !important;
            border-color: transparent !important;
        }

        html.dark #sidebar .bg-white {
            background-color: #191919 !important;
        }

        html.dark #sidebar .border-slate-100 {
            border-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* Floating popovers inside sidebar retain elevated card surface */
        html.dark #sidebar .shadow-lg,
        html.dark #sidebar .shadow-xl {
            background-color: #202020 !important;
            border-color: #2e2e2e !important;
        }`;

if (!html.includes(oldDarkSidebar)) {
  console.error('Could not find oldDarkSidebar in index.html');
  process.exit(1);
}
html = html.replace(oldDarkSidebar, newDarkSidebar);
console.log('✓ Updated global dark sidebar rules to match #191919 seamless canvas');

// 4. Update the Ideogram Image Home sidebar rule to be GLOBAL across all workspace views
const oldHomeSidebar = `        /* Ideogram Image Home - Seamless Unified Canvas without Vertical Divider */
        body.image-home-active #sidebar {
            border-right: none !important;
            border-right-color: transparent !important;
            background-color: #ffffff !important;
        }
        html.dark body.image-home-active #sidebar {
            border-right: none !important;
            border-right-color: transparent !important;
            background-color: #191919 !important;
        }
        body.image-home-active #image-home-view {
            background-color: #ffffff !important;
        }
        html.dark body.image-home-active #image-home-view {
            background-color: #191919 !important;
        }`;

const newGlobalShell = `        /* Global Application Shell - Seamless Unified Canvas & Borderless Sidebar across All Views */
        #sidebar {
            border-right: none !important;
            border-right-color: transparent !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
        }
        html.dark #sidebar {
            border-right: none !important;
            border-right-color: transparent !important;
            box-shadow: none !important;
            background-color: #191919 !important;
        }
        @media (max-width: 767px) {
            #sidebar.mobile-open {
                box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12) !important;
            }
        }
        main {
            background-color: #ffffff;
        }
        html.dark main {
            background-color: #191919 !important;
        }
        body.image-home-active #image-home-view {
            background-color: #ffffff !important;
        }
        html.dark body.image-home-active #image-home-view {
            background-color: #191919 !important;
        }`;

if (!html.includes(oldHomeSidebar)) {
  console.error('Could not find oldHomeSidebar in index.html');
  process.exit(1);
}
html = html.replace(oldHomeSidebar, newGlobalShell);
console.log('✓ Updated global shell rules for borderless sidebar and unified canvas');

// 5. Update <aside id="sidebar" class="..."> tag
const oldSidebarTag = `<aside id="sidebar"
        class="w-64 bg-white border-r border-slate-200 flex flex-col h-screen z-50 shrink-0 select-none">`;

const newSidebarTag = `<aside id="sidebar"
        class="w-64 bg-white dark:bg-[#191919] border-r-0 border-transparent flex flex-col h-screen z-50 shrink-0 select-none">`;

if (!html.includes(oldSidebarTag)) {
  console.error('Could not find oldSidebarTag in index.html');
  process.exit(1);
}
html = html.replace(oldSidebarTag, newSidebarTag);
console.log('✓ Updated <aside id="sidebar"> class');

// 6. Update <main class="..."> tag
const oldMainTag = `<main class="flex-1 flex flex-col h-full relative min-w-0">`;
const newMainTag = `<main class="flex-1 flex flex-col h-full relative min-w-0 bg-white dark:bg-[#191919]">`;

if (!html.includes(oldMainTag)) {
  console.error('Could not find oldMainTag in index.html');
  process.exit(1);
}
html = html.replace(oldMainTag, newMainTag);
console.log('✓ Updated <main> class');

// 7. Update slides workspace container and gradient
const oldSlidesTag = `<div id="slides-studio-workspace"
            class="hidden flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-[#F8FAFC] relative"
            style="padding-top: 0; margin-top: 0;">`;

const newSlidesTag = `<div id="slides-studio-workspace"
            class="hidden flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-white dark:bg-[#191919] relative"
            style="padding-top: 0; margin-top: 0;">`;

if (!html.includes(oldSlidesTag)) {
  console.error('Could not find oldSlidesTag in index.html');
  process.exit(1);
}
html = html.replace(oldSlidesTag, newSlidesTag);
console.log('✓ Updated slides workspace background');

const oldSlidesGrad = `<div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#F8FAFC]/70 to-[#F8FAFC]"></div>`;
const newSlidesGrad = `<div class="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-[#191919]/70 dark:to-[#191919]"></div>`;

if (!html.includes(oldSlidesGrad)) {
  console.error('Could not find oldSlidesGrad in index.html');
  process.exit(1);
}
html = html.replace(oldSlidesGrad, newSlidesGrad);
console.log('✓ Updated slides gradient transition');

// 8. Update projects workspace container
const oldProjectsTag = `<div id="projects-workspace" class="hidden flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#F8FAFC]">`;
const newProjectsTag = `<div id="projects-workspace" class="hidden flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-white dark:bg-[#191919]">`;

if (!html.includes(oldProjectsTag)) {
  console.error('Could not find oldProjectsTag in index.html');
  process.exit(1);
}
html = html.replace(oldProjectsTag, newProjectsTag);
console.log('✓ Updated projects workspace background');

// 9. Update library workspace container
const oldLibraryTag = `<div id="library-workspace"
            class="hidden flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-white px-8 pt-5 pb-8">`;

const newLibraryTag = `<div id="library-workspace"
            class="hidden flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-white dark:bg-[#191919] px-8 pt-5 pb-8">`;

if (!html.includes(oldLibraryTag)) {
  console.error('Could not find oldLibraryTag in index.html');
  process.exit(1);
}
html = html.replace(oldLibraryTag, newLibraryTag);
console.log('✓ Updated library workspace background');

// 10. Update image-chat workspace container
const oldImageChatTag = `<div id="image-chat-workspace"
            class="hidden flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#fbfbfb] dark:bg-[#181818] relative">`;

const newImageChatTag = `<div id="image-chat-workspace"
            class="hidden flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-white dark:bg-[#191919] relative">`;

if (!html.includes(oldImageChatTag)) {
  console.error('Could not find oldImageChatTag in index.html');
  process.exit(1);
}
html = html.replace(oldImageChatTag, newImageChatTag);
console.log('✓ Updated image-chat workspace background');

// 11. Update sidebar profile footer background in markup
const oldSidebarFooter = `<div class="p-3 border-t border-slate-100 mt-auto bg-white">`;
const newSidebarFooter = `<div class="p-3 border-t border-slate-100/80 dark:border-zinc-800/40 mt-auto bg-white dark:bg-[#191919]">`;

if (!html.includes(oldSidebarFooter)) {
  console.error('Could not find oldSidebarFooter in index.html');
  process.exit(1);
}
html = html.replace(oldSidebarFooter, newSidebarFooter);
console.log('✓ Updated sidebar footer background');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\nSuccessfully saved all seamless global canvas updates to index.html!');

