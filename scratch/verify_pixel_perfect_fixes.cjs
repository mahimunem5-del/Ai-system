const fs = require('fs');

console.log('=== VERIFYING ACCURATE PIXEL-PERFECT PROMPT BOX FIXES ===');

// --- 1. Verify index.html ---
const html = fs.readFileSync('index.html', 'utf8');

// Check auto-focus removal
if (html.includes('setTimeout(() => homeInput.focus(), 80);') && !html.includes('if (options.focus && homeInput)')) {
  console.error('FAIL: index.html still auto-focuses on default view entry');
  process.exit(1);
}
console.log('✓ index.html default auto-focus cleanly removed');

// Check Row 2 wrapper and rows="1"
if (!html.includes('id="image-home-input-wrapper"') ||
    !html.includes('relative flex-1 flex items-center w-full min-h-[68px] cursor-text') ||
    !html.includes('<textarea id="image-home-prompt-input" rows="1"')) {
  console.error('FAIL: index.html Row 2 wrapper or textarea rows="1" missing');
  process.exit(1);
}
console.log('✓ index.html Row 2 wrapper (relative flex-1 flex items-center) and rows="1" verified');

// Check overlay coordinate matching
if (!html.includes('pointer-events-none absolute left-0 top-0 w-full h-full flex items-center select-none text-sm sm:text-[15px] font-normal leading-relaxed text-slate-400 dark:text-neutral-500 m-0 p-0 transition-opacity duration-200 z-0')) {
  console.error('FAIL: index.html overlay coordinate classes missing');
  process.exit(1);
}
console.log('✓ index.html overlay coordinate matching verified');

// Check visibility logic (hasText check)
if (!html.includes('const hasText = homePrompt.value.length > 0;') ||
    !html.includes('overlay.classList.add(\'opacity-0\', \'pointer-events-none\');') ||
    !html.includes('overlay.classList.remove(\'opacity-0\', \'pointer-events-none\');')) {
  console.error('FAIL: index.html visibility logic missing');
  process.exit(1);
}
console.log('✓ index.html visibility logic (typing vs empty) verified');

// Check focus preserves ghost placeholder
if (!html.includes('if (isHomePromptFocused || (homePrompt && document.activeElement === homePrompt))') ||
    !html.includes('adjustHomePromptHeight();')) {
  console.error('FAIL: index.html focus ghost placeholder or adjustHomePromptHeight missing');
  process.exit(1);
}
console.log('✓ index.html focus ghost placeholder and auto-height adjustment verified');

// Check JS syntax
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

// --- 2. Verify ImageWorkspace.tsx ---
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

if (tsx.includes('autoFocus')) {
  console.error('FAIL: ImageWorkspace.tsx still has autoFocus');
  process.exit(1);
}
console.log('✓ ImageWorkspace.tsx autoFocus removed');

if (!tsx.includes('rows={1}') || !tsx.includes('relative flex-1 flex items-center w-full min-h-[68px] cursor-text')) {
  console.error('FAIL: ImageWorkspace.tsx rows={1} or wrapper missing');
  process.exit(1);
}
console.log('✓ ImageWorkspace.tsx rows={1} and flex items-center wrapper verified');

if (!tsx.includes('prompt.length > 0 ? \'opacity-0 pointer-events-none\' : \'opacity-100\'')) {
  console.error('FAIL: ImageWorkspace.tsx visibility condition missing');
  process.exit(1);
}
console.log('✓ ImageWorkspace.tsx accurate visibility logic verified');

console.log('\nALL VERIFICATION CHECKS PASSED WITH FLYING COLORS!');

