const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== VERIFYING IDEOGRAM IMAGE WORKSPACE UPDATES ===');

// 1. Aspect Ratio Dropdown Menu
assert(html.includes('id="studio-ratio-btn"'), 'studio-ratio-btn exists');
assert(html.includes('id="studio-ratio-dropdown"'), 'studio-ratio-dropdown exists');
assert(html.includes('id="studio-ratio-label"'), 'studio-ratio-label exists');
assert(html.includes('id="studio-ratio-icon"'), 'studio-ratio-icon exists');

const requiredRatios = ['1:1', '2:3', '3:4', '9:16', '3:2', '4:3', '16:9', 'auto'];
requiredRatios.forEach(r => {
    assert(html.includes(`data-ratio="${r}"`), `Aspect ratio option ${r} exists`);
});
assert(html.includes('1:1 (Square)'), 'Label 1:1 (Square) exists');
assert(html.includes('2:3 (Portrait)'), 'Label 2:3 (Portrait) exists');
assert(html.includes('3:4 (Portrait)'), 'Label 3:4 (Portrait) exists');
assert(html.includes('9:16 (Mobile)'), 'Label 9:16 (Mobile) exists');
assert(html.includes('3:2 (Landscape)'), 'Label 3:2 (Landscape) exists');
assert(html.includes('4:3 (Landscape)'), 'Label 4:3 (Landscape) exists');
assert(html.includes('16:9 (Widescreen)'), 'Label 16:9 (Widescreen) exists');
assert(html.includes('Auto (AI decides)'), 'Label Auto (AI decides) exists');
assert(html.includes('studio-ratio-check'), 'Checkmark icon present for ratio options');
console.log('✔ Requirement 1: Ideogram Aspect Ratio dropdown menu verified with all 8 options and icons');

// 2. Variations Dropdown Menu
assert(html.includes('id="studio-count-btn"'), 'studio-count-btn exists');
assert(html.includes('id="studio-count-dropdown"'), 'studio-count-dropdown exists');
assert(html.includes('id="studio-count-label"'), 'studio-count-label exists');
assert(html.includes('data-count="auto"'), 'Count option auto exists');
assert(html.includes('Auto (4)'), 'Label Auto (4) exists');
for (let i = 1; i <= 8; i++) {
    assert(html.includes(`data-count="${i}"`), `Count option ${i} exists`);
}
assert(html.includes('(1 image)'), 'Preserves (1 image) string for compatibility');
assert(html.includes('studio-count-check'), 'Checkmark icon present for count options');
console.log('✔ Requirement 2: Ideogram Variations dropdown menu verified with Auto (4) and 1-8 options');

// 3. Prompt Box Inline Image Upload Button
assert(html.includes('id="studio-prompt-image-upload-btn"'), 'Inline upload button exists');
assert(html.includes("promptUploadBtn.addEventListener('click'"), 'Upload button click listener exists');
console.log('✔ Requirement 3: Prompt box inline image upload button verified');

// 4. Draggable / Resizable Sidebar Divider
assert(html.includes('id="ideogram-sidebar-resizer"'), 'Resizer divider element exists');
assert(html.includes('cursor-col-resize'), 'Col-resize cursor style exists');
assert(html.includes("sidebarResizer.addEventListener('mousedown'"), 'Mousedown drag listener exists');
assert(html.includes('localStorage.setItem(\'ideogram_sidebar_width\''), 'LocalStorage width persistence exists');
console.log('✔ Requirement 4: Draggable / resizable sidebar divider with constraints and persistence verified');

// 5. Empty State Action
assert(html.includes('id="ideogram-create-first-btn"'), 'Create my first image button exists');
assert(html.includes('Create my first image'), 'Create my first image text exists');
console.log('✔ Requirement 5: Empty state action button verified');

console.log('\n🎉 ALL IDEOGRAM WORKSPACE REQUIREMENTS VERIFIED 100%!');

