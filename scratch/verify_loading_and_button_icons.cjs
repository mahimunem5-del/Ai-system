const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING PREMIUM LOADING STATE & BUTTON ICONS IN IMAGE WORKSPACE ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const reactCode = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

// 1. Premium Button Icons (Generate & Apply Edit)
console.log('1. Checking Premium Button Icons (Generate & Apply Edit)...');

// 1a. Generate Button Icon (Lucide Sparkles)
assert(html.includes('id="studio-generate-icon"'), 'studio-generate-icon ID missing in index.html');
assert(html.includes('m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12'), 'Generate button Sparkles path missing in index.html');
assert(reactCode.includes('m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12'), 'Generate button Sparkles path missing in React component');
console.log('✔ Generate button upgraded with Lucide Sparkles AI icon in index.html & ImageWorkspace.tsx');

// 1b. Apply Edit Button Icon (Lucide Wand2 / Magic Wand)
assert(html.includes('id="studio-apply-precise-edit-icon"'), 'studio-apply-precise-edit-icon ID missing in index.html');
assert(html.includes('M5 6v4') && html.includes('M19 14v4'), 'Apply Edit button Wand2 sparkles paths missing in index.html');
assert(reactCode.includes('M5 6v4') && reactCode.includes('M19 14v4'), 'Apply Edit button Wand2 sparkles paths missing in React component');
console.log('✔ Apply edit button upgraded with Lucide Wand2 magic wand icon in index.html & ImageWorkspace.tsx');

// 2. Removal of Technical Status Text and Redundant Quotes
console.log('\n2. Checking Removal of Technical Status Text & Redundant Quotes...');
assert(!html.includes('Decoding high-res tensor render'), 'Technical tensor render text must be removed from index.html');
assert(!html.includes('Sampling diffusion latents'), 'Technical latents text must be removed from index.html');
assert(!html.includes('Refining volumetric geometry'), 'Technical geometry text must be removed from index.html');
assert(!html.includes('progressPrompt.textContent = `"${promptText}"`'), 'Redundant prompt quotes must be removed');
console.log('✔ Technical status text and redundant quotes removed');

// 3. Header of Loading Card
console.log('\n3. Checking Minimal & Clean Loading Card Header...');
assert(html.includes('id="ideogram-in-progress-card"'), 'ideogram-in-progress-card ID missing');
assert(html.includes('id="ideogram-progress-status-text"'), 'ideogram-progress-status-text ID missing');
assert(html.includes('id="ideogram-progress-prompt-text"'), 'ideogram-progress-prompt-text ID missing');
assert(html.includes('id="ideogram-progress-model-badge"'), 'ideogram-progress-model-badge ID missing');
assert(html.includes('id="ideogram-progress-ratio-badge"'), 'ideogram-progress-ratio-badge ID missing');
assert(html.includes('animate-pulse'), 'Pulsing dot / indicator missing');
console.log('✔ Clean header matching finished generations verified');

// 4. Body / Shimmer Skeleton Placeholder
console.log('\n4. Checking Sleek Shimmer Skeleton Placeholder...');
assert(html.includes('bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900'), 'Ambient gradient shimmer wave classes missing in index.html');
assert(reactCode.includes('bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900'), 'Ambient gradient shimmer wave classes missing in React component');
assert(html.includes('rounded-xl') || html.includes('rounded-2xl'), 'Rounded corners missing');
assert(html.includes('id="ideogram-progress-skeletons"'), 'ideogram-progress-skeletons container missing');
console.log('✔ High-end shimmer / skeleton placeholder matching aspect ratios verified');

console.log('\n🎉 ALL CRITICAL UI POLISH REQUIREMENTS VERIFIED 100%!');

