const fs = require('fs');
const vm = require('vm');

console.log('=== VERIFYING INDEX.HTML PROMPT BOX POLISH ===');
const html = fs.readFileSync('index.html', 'utf-8');

// 1. Shimmer CSS
if (!html.includes('@keyframes ideogramRefShimmer')) {
  throw new Error('ideogramRefShimmer keyframes missing');
}
if (!html.includes('animate-ref-shimmer')) {
  throw new Error('animate-ref-shimmer class missing');
}
console.log('✓ Shimmer & pulse CSS verified');

// 2. Directional Slide CSS
if (!html.includes('@keyframes ideogramPromptSlideIn') || !html.includes('@keyframes ideogramPromptSlideOut')) {
  throw new Error('Slide keyframes missing');
}
if (!html.includes('.ideogram-prompt-enter') || !html.includes('.ideogram-prompt-exit')) {
  throw new Error('Slide animation classes missing');
}
console.log('✓ Directional slide-in & fade CSS verified');

// 3. Frosted Glass Reference Slots
if (!html.includes('bg-neutral-100/60 dark:bg-neutral-800/40 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50')) {
  throw new Error('Primary frosted glass reference slot styling missing');
}
if (!html.includes('bg-neutral-100/30 dark:bg-neutral-800/20 backdrop-blur-sm border border-dashed border-neutral-200/40 dark:border-neutral-700/30')) {
  throw new Error('Ghost reference slot styling missing');
}
console.log('✓ Frosted glass reference slots & ghost slot verified');

// 4. Centered Vertical Balance
if (!html.includes('p-5 transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-white/20 relative z-10 flex flex-col justify-between min-h-[185px] sm:min-h-[195px]')) {
  throw new Error('Prompt card min-height and padding missing');
}
if (!html.includes('relative flex-1 w-full my-auto flex flex-col justify-center min-h-[58px] cursor-text')) {
  throw new Error('Centered vertical input wrapper missing');
}
if (!html.includes('id="image-home-placeholder-content" class="flex items-center flex-wrap gap-2 w-full"')) {
  throw new Error('Inline placeholder wrapper with Tab badge missing');
}
console.log('✓ Centered vertical balance & inline Tab badge verified');

// 5. JavaScript Transition Functions
if (!html.includes('updatePlaceholderDisplay(isTransition = false)')) {
  throw new Error('updatePlaceholderDisplay transition parameter missing');
}
if (!html.includes("targetEl.classList.add('ideogram-prompt-exit')") || !html.includes("targetEl.classList.add('ideogram-prompt-enter')")) {
  throw new Error('ideogram-prompt-exit / enter logic missing');
}
console.log('✓ Directional slide transition JS logic verified');

// 6. JS Syntax
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) throw new Error('Main script block not found');
try {
  new vm.Script(scriptMatch[1]);
  console.log('✓ index.html JavaScript syntax is 100% valid');
} catch (e) {
  throw new Error('JS Syntax error in index.html: ' + e.message);
}

console.log('\n=== VERIFYING IMAGEWORKSPACE.TSX PROMPT BOX POLISH ===');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

if (!tsx.includes('IDEOGRAM_ROTATING_PLACEHOLDERS')) {
  throw new Error('IDEOGRAM_ROTATING_PLACEHOLDERS missing in ImageWorkspace.tsx');
}
if (!tsx.includes('placeholderIndex, setPlaceholderIndex')) {
  throw new Error('placeholderIndex state missing in ImageWorkspace.tsx');
}
if (!tsx.includes('bg-neutral-100/60 dark:bg-neutral-800/40 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50')) {
  throw new Error('Frosted glass reference slot missing in ImageWorkspace.tsx');
}
if (!tsx.includes('relative flex-1 w-full my-auto flex flex-col justify-center min-h-[58px] cursor-text')) {
  throw new Error('Centered vertical input wrapper missing in ImageWorkspace.tsx');
}
console.log('✓ ImageWorkspace.tsx frosted glass, centered layout, and rotating placeholder verified');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');

