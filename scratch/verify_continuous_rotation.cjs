const fs = require('fs');

console.log('=== VERIFYING CONTINUOUS ROTATION (NEVER FREEZE ON FOCUS/BLUR) ===');

// --- 1. Verify index.html ---
const html = fs.readFileSync('index.html', 'utf8');

// Ensure no isHomePromptFocused check inside streamCurrentPrompt bailouts
const streamStart = html.indexOf('function streamCurrentPrompt()');
const streamEnd = html.indexOf('function startPlaceholderRotation()');
const streamCode = html.slice(streamStart, streamEnd);

if (streamCode.includes('isHomePromptFocused') || streamCode.includes('activeElement === homePrompt')) {
  console.error('FAIL: streamCurrentPrompt still contains focus checks that pause rotation');
  process.exit(1);
}
console.log('✓ streamCurrentPrompt: No focus checks pausing rotation');

// Ensure only prompt text length aborts
if (!streamCode.includes('homePrompt.value.trim().length > 0')) {
  console.error('FAIL: streamCurrentPrompt does not check homePrompt.value.trim().length > 0');
  process.exit(1);
}
console.log('✓ streamCurrentPrompt: Strictly checks homePrompt.value.trim().length > 0');

// Check focus/blur listeners
const initStart = html.indexOf('function initImageHomeView()');
const initEnd = html.indexOf('function submitHomePrompt()');
const initCode = html.slice(initStart, initEnd);

if (initCode.includes('if (!homePrompt.value.length) {\n                        const placeholderEl = document.getElementById(\'image-home-placeholder-text\');')) {
  console.error('FAIL: focus event listener still overrides rotating text');
  process.exit(1);
}
console.log('✓ Focus event listener does not override or freeze rotating text');

// Verify syntax of all scripts in index.html
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

const effectStart = tsx.indexOf('// Only pause or clear rotation if the user has typed text');
if (effectStart === -1) {
  console.error('FAIL: ImageWorkspace.tsx continuous rotation comment not found');
  process.exit(1);
}
const effectSlice = tsx.slice(effectStart, effectStart + 1500);

if (effectSlice.includes('isFocused')) {
  console.error('FAIL: ImageWorkspace.tsx useEffect still references isFocused');
  process.exit(1);
}
console.log('✓ ImageWorkspace.tsx: useEffect does not reference isFocused');

if (!tsx.includes('prompt.trim().length > 0 ? \'opacity-0 pointer-events-none\' : \'opacity-100\'')) {
  console.error('FAIL: ImageWorkspace.tsx overlay visibility condition not based on prompt.trim()');
  process.exit(1);
}
console.log('✓ ImageWorkspace.tsx: Overlay visibility strictly bound to prompt.trim().length > 0');

console.log('\nALL CONTINUOUS ROTATION CHECKS PASSED PERFECTLY!');

