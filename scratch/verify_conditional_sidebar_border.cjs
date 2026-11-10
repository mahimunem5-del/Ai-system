const fs = require('fs');

console.log('=== VERIFYING CONDITIONAL SIDEBAR RIGHT BORDER ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Check CSS rules for open and collapsed states
if (!html.includes('#sidebar {\n            background-color: #ffffff !important;\n            border-right: 1px solid rgba(229, 231, 235, 0.5) !important;') ||
    !html.includes('html.dark #sidebar {\n            background-color: #191919 !important;\n            border-right: 1px solid rgba(255, 255, 255, 0.08) !important;') ||
    !html.includes('#sidebar.sidebar-collapsed {\n            border-right: 1px solid transparent !important;\n            border-right-color: transparent !important;') ||
    !html.includes('html.dark #sidebar.sidebar-collapsed {\n            border-right: 1px solid transparent !important;\n            border-right-color: transparent !important;')) {
  console.error('FAIL: CSS rules for conditional border missing or incorrect');
  process.exit(1);
}
console.log('✓ CSS rules for open (subtle 1px border) and collapsed (borderless transparent) verified');

// 2. Check transition includes border-color for smooth visual consistency without layout jumps
if (!html.includes('border-color 200ms ease;')) {
  console.error('FAIL: border-color transition missing from #sidebar');
  process.exit(1);
}
console.log('✓ Smooth transition with border-color 200ms ease verified');

// 3. Check <aside id="sidebar"> tag markup
if (!html.includes('<aside id="sidebar"\n        class="w-64 bg-white dark:bg-[#191919] border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col h-screen z-50 shrink-0 select-none">')) {
  console.error('FAIL: <aside id="sidebar"> markup does not match expected initial expanded state');
  process.exit(1);
}
console.log('✓ <aside id="sidebar"> initial expanded state markup verified');

// 4. Check syncSidebarBorder function in JS
if (!html.includes('function syncSidebarBorder() {') ||
    !html.includes("sidebar.classList.add('border-transparent');") ||
    !html.includes("sidebar.classList.add('border-neutral-200/50', 'dark:border-neutral-800/50');")) {
  console.error('FAIL: syncSidebarBorder JS function missing or incomplete');
  process.exit(1);
}
console.log('✓ syncSidebarBorder() JavaScript handler verified');

// 5. Verify syntax of all scripts in index.html
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

console.log('\nALL CONDITIONAL SIDEBAR BORDER CHECKS PASSED WITH 100% SUCCESS!');

