const fs = require('fs');

console.log('=== VERIFYING SEAMLESS GLOBAL CANVAS & BORDERLESS SIDEBAR ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Body backgrounds
if (!html.includes("background-color: #ffffff;\n        }") || !html.includes("html.dark body {\n            background-color: #191919 !important;")) {
  console.error('FAIL: Body background tokens not unified to #ffffff / #191919');
  process.exit(1);
}
console.log('✓ Body background unified to #ffffff (light) and #191919 (dark)');

// 2. Global sidebar borderless rules
if (!html.includes('#sidebar {\n            border-right: none !important;\n            border-right-color: transparent !important;\n            box-shadow: none !important;\n            background-color: #ffffff !important;\n        }') ||
    !html.includes('html.dark #sidebar {\n            border-right: none !important;\n            border-right-color: transparent !important;\n            box-shadow: none !important;\n            background-color: #191919 !important;\n        }')) {
  console.error('FAIL: Global #sidebar borderless and background rules missing');
  process.exit(1);
}
console.log('✓ Global #sidebar borderless and seamless background rules verified');

// 3. Aside tag class
if (html.includes('class="w-64 bg-white border-r border-slate-200')) {
  console.error('FAIL: <aside id="sidebar"> still contains border-r border-slate-200');
  process.exit(1);
}
if (!html.includes('class="w-64 bg-white dark:bg-[#191919] border-r-0 border-transparent')) {
  console.error('FAIL: <aside id="sidebar"> missing borderless and theme classes');
  process.exit(1);
}
console.log('✓ <aside id="sidebar"> markup is borderless and seamless');

// 4. Main tag class
if (!html.includes('<main class="flex-1 flex flex-col h-full relative min-w-0 bg-white dark:bg-[#191919]">')) {
  console.error('FAIL: <main> missing seamless background classes');
  process.exit(1);
}
console.log('✓ <main> container background verified (bg-white dark:bg-[#191919])');

// 5. Workspaces background check
const workspaces = [
  { id: 'slides-studio-workspace', required: 'bg-white dark:bg-[#191919]' },
  { id: 'projects-workspace', required: 'bg-white dark:bg-[#191919]' },
  { id: 'library-workspace', required: 'bg-white dark:bg-[#191919]' },
  { id: 'image-chat-workspace', required: 'bg-white dark:bg-[#191919]' },
  { id: 'image-home-view', required: 'bg-white dark:bg-[#191919]' },
  { id: 'image-studio-workspace', required: 'bg-white dark:bg-[#191919]' }
];

workspaces.forEach(ws => {
  const idx = html.indexOf(`id="${ws.id}"`);
  if (idx === -1) {
    console.error(`FAIL: Workspace ${ws.id} not found`);
    process.exit(1);
  }
  const tag = html.slice(idx - 20, idx + 200);
  if (!tag.includes(ws.required)) {
    console.error(`FAIL: Workspace ${ws.id} does not contain ${ws.required}`);
    process.exit(1);
  }
  console.log(`✓ Workspace ${ws.id} background verified (${ws.required})`);
});

// 6. Check inner interactive elements are intact
const criticalElements = [
  'id="btn-create-project-header"',
  'id="slides-generate-btn"',
  'id="send-btn"',
  'id="sidebar-toggle-btn"',
  'id="sidebar-search-btn"',
  'id="new-chat-btn"'
];

criticalElements.forEach(el => {
  if (!html.includes(el)) {
    console.error(`FAIL: Critical element ${el} missing`);
    process.exit(1);
  }
});
console.log('✓ All critical inner buttons and interactive triggers intact');

// 7. Verify syntax of all scripts in index.html
const scriptOpen = '<script>';
const scriptClose = '</script>';
let lastScriptEnd = 0;
let scriptCount = 0;
while (true) {
  const sIdx = html.indexOf(scriptOpen, lastScriptEnd);
  if (sIdx === -1) break;
  const eIdx = html.indexOf(scriptClose, sIdx);
  if (eIdx === -1) break;
  const code = html.slice(sIdx + scriptOpen.length, eIdx);
  scriptCount++;
  try {
    new Function(code);
  } catch (err) {
    console.error(`FAIL: JavaScript syntax error in script #${scriptCount}:`, err.message);
    process.exit(1);
  }
  lastScriptEnd = eIdx + scriptClose.length;
}
console.log(`✓ All ${scriptCount} script blocks in index.html have 100% valid JavaScript syntax`);

console.log('\nALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
