const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const occurrences = [
  'class="hidden flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden min-w-0 bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 select-none relative font-sans">',
  'class="w-full md:w-[380px] shrink-0 h-full flex flex-col bg-white dark:bg-[#0c1017] z-20 overflow-hidden"',
  'class="flex-1 w-full h-full min-w-0 flex flex-col bg-white dark:bg-[#0c1017] overflow-hidden relative">',
  '<div id="ideogram-assets-viewport" class="flex-1 w-full overflow-y-auto p-4 sm:p-6 space-y-6 ideogram-custom-scroll bg-white dark:bg-[#0c1017]">',
  '<div id="ideogram-api-view" class="hidden flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 ideogram-custom-scroll bg-white dark:bg-[#0c1017]">'
];

occurrences.forEach(occ => {
  if (!html.includes(occ)) {
    console.error('Could not find occurrence:', occ);
    process.exit(1);
  }
  const rep = occ.replace(/dark:bg-\[#0c1017\]/g, 'dark:bg-[#191919]');
  html = html.replace(occ, rep);
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Successfully unified dark:bg-[#0c1017] to dark:bg-[#191919] in index.html!');

