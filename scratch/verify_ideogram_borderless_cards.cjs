const fs = require('fs');
const vm = require('vm');

console.log('=== VERIFYING INDEX.HTML ===');
const html = fs.readFileSync('index.html', 'utf-8');

// 1. Container alignment
const containerMatch = html.match(/id="image-home-view"[\s\S]*?<div class="flex-1 w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-10 sm:pt-14 pb-16 flex flex-col gap-10 relative z-10">/);
if (!containerMatch) {
  throw new Error('Container in index.html is not left-aligned full-width!');
}
console.log('✓ Container alignment verified: w-full px-6 sm:px-8 md:px-10 lg:px-12');

// 2. Check that max-w-5xl mx-auto is removed from home view content wrapper
if (html.includes('<div class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8')) {
  throw new Error('Found old max-w-5xl mx-auto container in index.html');
}
console.log('✓ Old constrained max-w-5xl mx-auto container successfully removed');

// 3. Section Titles Typography
if (!html.includes('<h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Recent Creations</h2>')) {
  throw new Error('Recent Creations title typography does not match Ideogram spec!');
}
if (!html.includes('<h2 class="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Design Templates & Styles</h2>')) {
  throw new Error('Design Templates title typography does not match Ideogram spec!');
}
console.log('✓ Section titles typography verified: text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100');

// 4. Subtitle removed
if (html.includes('Curated aesthetic styles and prompts ready for generation and smart editing.')) {
  throw new Error('Subtitle under Design Templates was not removed!');
}
console.log('✓ Subtitle under Design Templates confirmed removed');

// 5. Borderless card & hover overlay in renderImageHomeCreations
const creationsFnStart = html.indexOf('function renderImageHomeCreations()');
const creationsFnEnd = html.indexOf('function renderImageHomeTemplates()');
const creationsCode = html.slice(creationsFnStart, creationsFnEnd);

if (creationsCode.includes('Card Footer')) {
  throw new Error('Card Footer still found in renderImageHomeCreations!');
}
if (!creationsCode.includes('group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-[#1f1f1f] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer')) {
  throw new Error('Borderless card class not found in renderImageHomeCreations!');
}
if (!creationsCode.includes('opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20 pointer-events-none group-hover:pointer-events-auto')) {
  throw new Error('Hover overlay classes not found in renderImageHomeCreations!');
}
if (!creationsCode.includes('bg-gradient-to-t from-black/80 via-transparent to-black/40')) {
  throw new Error('Hover gradient not found in renderImageHomeCreations!');
}
console.log('✓ renderImageHomeCreations pure borderless card and hover overlay verified');

// 6. Borderless card & hover overlay in renderImageHomeTemplates
const templatesFnStart = creationsFnEnd;
const templatesFnEnd = html.indexOf('function setImageStudioMode(', templatesFnStart);
const templatesCode = html.slice(templatesFnStart, templatesFnEnd);

if (templatesCode.includes('Card Footer')) {
  throw new Error('Card Footer still found in renderImageHomeTemplates!');
}
if (!templatesCode.includes('group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 dark:bg-[#1f1f1f] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer')) {
  throw new Error('Borderless card class not found in renderImageHomeTemplates!');
}
if (!templatesCode.includes('opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20 pointer-events-none group-hover:pointer-events-auto')) {
  throw new Error('Hover overlay classes not found in renderImageHomeTemplates!');
}
if (!templatesCode.includes('bg-gradient-to-t from-black/80 via-transparent to-black/40')) {
  throw new Error('Hover gradient not found in renderImageHomeTemplates!');
}
console.log('✓ renderImageHomeTemplates pure borderless card and hover overlay verified');

// 7. JS Syntax
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

if (!tsx.includes('className="flex-1 w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-10 sm:pt-14 pb-16 flex flex-col gap-10 relative z-10"')) {
  throw new Error('Container in ImageWorkspace.tsx is not left-aligned full-width!');
}
console.log('✓ Container alignment verified in ImageWorkspace.tsx');

if (!tsx.includes('<h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Recent Creations</h2>')) {
  throw new Error('Recent Creations title typography does not match Ideogram spec in ImageWorkspace.tsx!');
}
console.log('✓ Title typography verified in ImageWorkspace.tsx');

if (!tsx.includes('aspect-square bg-slate-100 dark:bg-[#1f1f1f] shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer')) {
  throw new Error('Borderless card class not found in ImageWorkspace.tsx');
}
if (!tsx.includes('opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-20 pointer-events-none group-hover:pointer-events-auto')) {
  throw new Error('Hover overlay classes not found in ImageWorkspace.tsx');
}
console.log('✓ Borderless cards and hover overlay verified in ImageWorkspace.tsx');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');

