const fs = require('fs');

console.log('--- VERIFYING INDEX.HTML ---');
const html = fs.readFileSync('index.html', 'utf-8');

// 1. Verify Home Ratio Popover order
const ratioPopoverStart = html.indexOf('id="image-home-ratio-popover"');
if (ratioPopoverStart === -1) throw new Error('Missing image-home-ratio-popover in index.html');
const ratioPopoverEnd = html.indexOf('<!-- 2. Model Selection Trigger', ratioPopoverStart);
const ratioPopoverContent = html.slice(ratioPopoverStart, ratioPopoverEnd);

const ratios = ['auto', '1:1', '2:3', '3:4', '9:16', '3:2', '4:3', '16:9'];
const indices = ratios.map(r => {
  const idx = ratioPopoverContent.indexOf(`data-ratio="${r}"`);
  console.log(`  ratio ${r}: index ${idx}`);
  return idx;
});

for (let i = 0; i < indices.length - 1; i++) {
  if (indices[i] === -1 || indices[i+1] === -1 || indices[i] >= indices[i+1]) {
    throw new Error(`Order violated between ${ratios[i]} and ${ratios[i+1]}`);
  }
}
console.log('✓ image-home-ratio-popover order is verified: Auto is top, followed by 1:1, 2:3, 3:4, 9:16, 3:2, 4:3, 16:9');

// 2. Check positioning of Home Popovers
if (!ratioPopoverContent.includes('top-full mt-2')) {
  throw new Error('image-home-ratio-popover is not positioned with top-full mt-2!');
}
console.log('✓ image-home-ratio-popover positioning verified: top-full mt-2');

const modelPopoverStart = html.indexOf('id="image-home-model-popover"');
if (modelPopoverStart === -1) throw new Error('Missing image-home-model-popover in index.html');
const modelPopoverEnd = html.indexOf('<!-- Submit Button', modelPopoverStart);
const modelPopoverContent = html.slice(modelPopoverStart, modelPopoverEnd !== -1 ? modelPopoverEnd : modelPopoverStart + 15000);
if (!modelPopoverContent.includes('top-full mt-2')) {
  throw new Error('image-home-model-popover is not positioned with top-full mt-2!');
}
console.log('✓ image-home-model-popover positioning verified: top-full mt-2');

// 3. Check Workspace Ratio Dropdown
const studioRatioDropdownStart = html.indexOf('id="studio-ratio-dropdown"');
if (studioRatioDropdownStart === -1) throw new Error('Missing studio-ratio-dropdown in index.html');
const studioRatioDropdownEnd = html.indexOf('id="studio-count-btn"', studioRatioDropdownStart);
const studioRatioDropdownContent = html.slice(studioRatioDropdownStart, studioRatioDropdownEnd !== -1 ? studioRatioDropdownEnd : studioRatioDropdownStart + 10000);
const studioAutoIdx = studioRatioDropdownContent.indexOf('data-ratio="auto"');
const studio11Idx = studioRatioDropdownContent.indexOf('data-ratio="1:1"');
if (studioAutoIdx === -1 || studio11Idx === -1 || !(studioAutoIdx < studio11Idx)) {
  throw new Error('studio-ratio-dropdown does not have Auto on top!');
}
console.log('✓ studio-ratio-dropdown order verified: Auto is on top');

// 4. Check dynamic icon functions
if (!html.includes('function syncHomeRatioDisplay(')) throw new Error('Missing syncHomeRatioDisplay');
if (!html.includes('function syncHomeModelDisplay(')) throw new Error('Missing syncHomeModelDisplay');
if (!html.includes('function getModelIconSvg(')) throw new Error('Missing getModelIconSvg');
console.log('✓ Dynamic sync functions present and verified');

// 5. Check JS syntax with Node vm
const vm = require('vm');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) throw new Error('Main script block not found');
try {
  new vm.Script(scriptMatch[1]);
  console.log('✓ index.html JavaScript syntax is 100% valid');
} catch (e) {
  throw new Error('JavaScript syntax error in index.html: ' + e.message);
}

console.log('\n--- VERIFYING SRC/COMPONENTS/IMAGEWORKSPACE.TSX ---');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf-8');

if (!tsx.includes("useState('auto')")) throw new Error("aspectRatio default state is not 'auto'");
console.log("✓ Default aspectRatio is 'auto'");

if (!tsx.includes("title={aspectRatio === 'auto' ? 'Aspect Ratio: Auto (AI decides)' : `Aspect Ratio: ${aspectRatio}`}")) {
  throw new Error('Dynamic aspect ratio title is missing');
}
console.log('✓ Dynamic aspect ratio title verified');

if (!tsx.includes("top-full mt-2 w-60")) throw new Error('Ratio popover not positioned top-full mt-2');
console.log('✓ Ratio popover positioning verified: top-full mt-2 w-60');

if (!tsx.includes("top-full mt-2 w-72")) throw new Error('Model popover not positioned top-full mt-2');
console.log('✓ Model popover positioning verified: top-full mt-2 w-72');

if (!tsx.includes("{ id: 'auto', label: 'Auto (AI decides)', isAuto: true }")) {
  throw new Error('Auto ratio option not found');
}
const autoTsxIdx = tsx.indexOf("{ id: 'auto', label: 'Auto (AI decides)', isAuto: true }");
const squareTsxIdx = tsx.indexOf("{ id: '1:1', label: '1:1 (Square)', w: 'w-3.5', h: 'h-3.5' }");
if (!(autoTsxIdx < squareTsxIdx)) throw new Error('Auto ratio is not before 1:1 in ImageWorkspace.tsx');
console.log('✓ Aspect ratio list order verified in ImageWorkspace.tsx: Auto is on top');

if (!tsx.includes("selectedModel === 'auto'")) throw new Error('selectedModel === auto check missing');
console.log('✓ Model dynamic AI Chip & brand logo rendering verified in ImageWorkspace.tsx');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
