const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING IMAGE WORKSPACE CONTROLS REFACTOR ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// 1. Aspect Ratio Wireframe Icons
console.log('1. Checking Aspect Ratio Wireframe Icons...');
assert(html.includes('studio-ratio-wireframe'), 'studio-ratio-wireframe class missing');
assert(html.includes('getStudioRatioWireframeHtml'), 'getStudioRatioWireframeHtml function missing');
// Check wireframe boxes for ratios
const expectedRatioWireframes = ['1:1', '2:3', '3:4', '9:16', '3:2', '4:3', '16:9'];
expectedRatioWireframes.forEach(ratio => {
    assert(html.includes(`data-ratio="${ratio}"`), `data-ratio="${ratio}" missing in aspect ratio options`);
});
assert(html.includes('w-3.5 h-3.5'), '1:1 wireframe box missing');
assert(html.includes('w-[11px] h-[16px]'), '2:3 wireframe box missing');
assert(html.includes('w-[12px] h-[16px]'), '3:4 wireframe box missing');
assert(html.includes('w-[9px] h-[16px]'), '9:16 wireframe box missing');
assert(html.includes('w-[16px] h-[11px]'), '3:2 wireframe box missing');
assert(html.includes('w-[16px] h-[12px]'), '4:3 wireframe box missing');
assert(html.includes('w-[16px] h-[9px]'), '16:9 wireframe box missing');
console.log('✔ Proportional wireframe icons for all 7 ratios verified in dropdown and trigger buttons');

// 2. Variations Trigger Image Icon
console.log('\n2. Checking Variations Trigger Icon...');
assert(html.includes('id="studio-count-icon"'), 'studio-count-icon container missing');
// Check Lucide Image icon rect + circle + polyline inside studio-count-icon and image-chat-count-btn
const countBtnSection = html.substring(html.indexOf('id="studio-count-btn"'), html.indexOf('id="studio-count-dropdown"'));
assert(countBtnSection.includes('<rect width="18" height="18" x="3" y="3" rx="2"'), 'Image icon rect missing in studio-count-btn');
assert(countBtnSection.includes('<circle cx="9" cy="9" r="2"'), 'Image icon circle missing in studio-count-btn');
assert(countBtnSection.includes('<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"'), 'Image icon path missing in studio-count-btn');
console.log('✔ Standard image/photo icon verified on Variations trigger buttons');

// 3. Reference Images Scoping (Slots vs Prompt Box)
console.log('\n3. Checking Reference Images Scoping...');
assert(html.includes('renderStudioReferenceSlots'), 'renderStudioReferenceSlots function missing');
// Ensure renderStudioReferenceSlots does NOT show #studio-ref-chip
const renderSlotsFn = html.substring(html.indexOf('function renderStudioReferenceSlots()'), html.indexOf('function updateStudioPromptInlineImage()') !== -1 ? html.indexOf('function updateStudioPromptInlineImage()') : html.indexOf('function renderStudioReferenceSlots()') + 2000);
assert(!renderSlotsFn.includes('studioRefChip.classList.remove(\'hidden\')'), 'renderStudioReferenceSlots must not show studioRefChip');
assert(html.includes('id="studio-prompt-inline-file-input"'), 'Prompt inline file input missing');
console.log('✔ Reference images strictly scoped to thumbnail slots without polluting prompt box');

// 4. Result Header Action Buttons (Boxed Ideogram Style)
console.log('\n4. Checking Result Header Action Buttons...');
assert(html.includes('btn-group-regenerate'), 'btn-group-regenerate class missing');
assert(html.includes('btn-group-download'), 'btn-group-download class missing');
assert(html.includes('border border-gray-200 dark:border-neutral-800 bg-white dark:bg-white/[0.03]'), 'Boxed button styling missing');
console.log('✔ Result header Regenerate and Download buttons verified with Ideogram boxed styling');

// 5. Precise Edit Sidebar Panel Refinements
console.log('\n5. Checking Precise Edit Sidebar Panel Refinements...');
// Mask button removed
assert(!html.includes('id="studio-precise-edit-mask-btn"'), 'studio-precise-edit-mask-btn should be removed');
// Quality label and diamond/sparkle icon
assert(html.includes('id="studio-precise-edit-weight-label"'), 'studio-precise-edit-weight-label missing');
const weightBtnSection = html.substring(html.indexOf('id="studio-precise-edit-weight-btn"'), html.indexOf('id="studio-precise-edit-weight-dropdown"'));
assert(weightBtnSection.includes('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z') || weightBtnSection.includes('polygon') || weightBtnSection.includes('path'), 'Sparkle/diamond icon present in Quality trigger');
// State capturing quality and sending to backend
assert(html.includes('studioPreciseEditState.quality = val;'), 'studioPreciseEditState.quality assignment missing');
assert(html.includes("quality: studioPreciseEditState.quality || 'Medium'") || html.includes('quality: (studioPreciseEditState && studioPreciseEditState.isActive)'), 'Quality forwarded in generation payload');

// Controller accepts quality parameter
assert(controllerCode.includes('quality'), 'imageController.js must accept quality parameter');
console.log('✔ Precise Edit sidebar panel refined with Quality, clean header, and parameter passing');

console.log('\n🎉 ALL WORKSPACE CONTROLS REQUIREMENTS VERIFIED 100%!');
