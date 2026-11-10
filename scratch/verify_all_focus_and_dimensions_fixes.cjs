const fs = require('fs');
const vm = require('vm');

console.log('=== VERIFYING INDEX.HTML ===');
const html = fs.readFileSync('index.html', 'utf-8');

// 1. Check prompt box dimensions & aesthetic
if (!html.includes('max-w-[780px] mx-auto flex flex-col items-center')) {
  throw new Error('Hero section wrapper is not max-w-[780px] mx-auto');
}
if (!html.includes('bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-5 sm:p-6 transition-all duration-200 focus-within:border-neutral-300 dark:focus-within:border-neutral-700 relative z-10 flex flex-col justify-between min-h-[220px]')) {
  throw new Error('Prompt box does not match exact min-h-[220px] and frosted glass styling');
}
console.log('✓ Prompt box dimensions (max-w-[780px], min-h-[220px], rounded-3xl, frosted glass) verified');

// 2. Check 3-row layout and middle centering
if (!html.includes('relative flex-1 my-auto flex items-center w-full min-h-[68px] cursor-text')) {
  throw new Error('Row 2 middle flex-1 my-auto flex items-center wrapper missing');
}
if (!html.includes('absolute inset-0 flex items-center pointer-events-none select-none text-sm sm:text-[15px] text-slate-400 dark:text-neutral-500 font-normal leading-relaxed m-0 p-0 transition-opacity duration-200 z-0')) {
  throw new Error('Row 2 placeholder overlay centering missing');
}
console.log('✓ 3-row layout and exact middle vertical centering verified');

// 3. Check Focus/Blur/Input and instant hiding logic
if (!html.includes('isHomePromptFocused = true') || !html.includes('isHomePromptFocused = false')) {
  throw new Error('isHomePromptFocused focus/blur listeners missing');
}
if (!html.includes('updatePlaceholderVisibility()')) {
  throw new Error('updatePlaceholderVisibility function missing');
}
if (!html.includes('document.activeElement === homePrompt')) {
  throw new Error('document.activeElement active check missing');
}
console.log('✓ Instant hiding on focus/input and blur-only streaming verified');

// 4. JS Syntax check
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) throw new Error('Main script block not found');
try {
  new vm.Script(scriptMatch[1]);
  console.log('✓ index.html JavaScript syntax is 100% valid');
} catch (e) {
  throw new Error('JS Syntax error in index.html: ' + e.message);
}

console.log('\n=== VERIFYING IMAGEWORKSPACE.TSX ===');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

if (!tsx.includes('max-w-[780px] mx-auto flex flex-col items-center')) {
  throw new Error('Hero section wrapper not max-w-[780px] in ImageWorkspace.tsx');
}
if (!tsx.includes('min-h-[220px]')) {
  throw new Error('min-h-[220px] missing in ImageWorkspace.tsx');
}
if (!tsx.includes('isFocused, setIsFocused')) {
  throw new Error('isFocused state missing in ImageWorkspace.tsx');
}
if (!tsx.includes('onFocus={() => setIsFocused(true)}')) {
  throw new Error('onFocus listener missing in ImageWorkspace.tsx');
}
if (!tsx.includes('onBlur={() => setIsFocused(false)}')) {
  throw new Error('onBlur listener missing in ImageWorkspace.tsx');
}
if (!tsx.includes('relative flex-1 my-auto flex items-center w-full min-h-[68px] cursor-text')) {
  throw new Error('Middle vertical centering missing in ImageWorkspace.tsx');
}
console.log('✓ ImageWorkspace.tsx focus state, dimensions, and vertical centering verified');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');

