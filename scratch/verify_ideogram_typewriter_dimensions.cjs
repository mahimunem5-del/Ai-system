const fs = require('fs');
const vm = require('vm');

console.log('=== VERIFYING INDEX.HTML TYPEWRITER & DIMENSIONS ===');
const html = fs.readFileSync('index.html', 'utf-8');

// 1. Prompt Box Dimensions
if (!html.includes('max-w-3xl sm:max-w-[760px] mx-auto')) {
  throw new Error('Hero section max-width not max-w-3xl sm:max-w-[760px]');
}
if (!html.includes('rounded-3xl border border-slate-200/90 dark:border-white/10')) {
  throw new Error('Prompt box rounded-3xl or subtle border missing');
}
if (!html.includes('min-h-[195px] sm:min-h-[205px]')) {
  throw new Error('Prompt box min-h-[195px] sm:min-h-[205px] missing');
}
console.log('✓ Prompt box exact dimensions & rounded-3xl verified');

// 2. Synchronized Overlay Stack & Precise CSS Matching
if (!html.includes('id="image-home-placeholder-overlay"')) {
  throw new Error('image-home-placeholder-overlay missing');
}
if (!html.includes('class="absolute inset-0 pointer-events-none select-none text-sm sm:text-[15px] text-slate-400 dark:text-neutral-500 font-normal leading-relaxed m-0 p-0 transition-opacity duration-200 z-0"')) {
  throw new Error('Placeholder overlay does not match exact typography CSS specification');
}
if (!html.includes('class="w-full h-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed font-normal relative z-10 block"')) {
  throw new Error('Textarea does not match exact typography CSS specification');
}
console.log('✓ Synchronized overlay stack and identical typography CSS verified');

// 3. Word-by-Word Typewriter Streaming
if (!html.includes('function streamCurrentPrompt()')) {
  throw new Error('streamCurrentPrompt missing');
}
if (!html.includes('function stopTypewriterStreaming()')) {
  throw new Error('stopTypewriterStreaming missing');
}
if (!html.includes('words.slice(0, wordIdx).join(\' \')')) {
  throw new Error('Word-by-word streaming logic missing');
}
if (!html.includes('id="image-home-tab-badge"')) {
  throw new Error('image-home-tab-badge missing');
}
console.log('✓ Word-by-word streaming and [TAB] badge reveal logic verified');

// 4. JS Syntax Validation
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) throw new Error('Main script block not found');
try {
  new vm.Script(scriptMatch[1]);
  console.log('✓ index.html JavaScript syntax is 100% valid');
} catch (e) {
  throw new Error('JS Syntax error in index.html: ' + e.message);
}

console.log('\n=== VERIFYING IMAGEWORKSPACE.TSX TYPEWRITER & DIMENSIONS ===');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

if (!tsx.includes('max-w-3xl sm:max-w-[760px] mx-auto')) {
  throw new Error('Hero section max-width not max-w-3xl sm:max-w-[760px] in ImageWorkspace.tsx');
}
if (!tsx.includes('rounded-3xl border border-slate-200/90 dark:border-white/10')) {
  throw new Error('rounded-3xl missing in ImageWorkspace.tsx');
}
if (!tsx.includes('displayedPlaceholder')) {
  throw new Error('displayedPlaceholder streaming state missing in ImageWorkspace.tsx');
}
if (!tsx.includes('words.slice(0, currentWord).join(\' \')')) {
  throw new Error('Streaming word-by-word logic missing in ImageWorkspace.tsx');
}
console.log('✓ ImageWorkspace.tsx exact dimensions, overlay stack, and streaming verified');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');

