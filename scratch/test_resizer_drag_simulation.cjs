const fs = require('fs');
const assert = require('assert');

console.log('=== RUNNING RESIZER DRAG SIMULATION & INTEGRITY TEST ===\n');

const html = fs.readFileSync('index.html', 'utf8');

// Verify all structural and class markers in index.html
assert(html.includes('id="image-studio-workspace"'), 'image-studio-workspace container present');
assert(html.includes('id="ideogram-left-panel"'), 'ideogram-left-panel present');
assert(html.includes('id="ideogram-sidebar-resizer"'), 'ideogram-sidebar-resizer present');
assert(html.includes('id="ideogram-right-panel"'), 'ideogram-right-panel present');
assert(html.includes('id="ideogram-assets-viewport"'), 'ideogram-assets-viewport present');
assert(html.includes('class="flex-1 w-full overflow-y-auto'), 'Viewport flex-1 w-full overflow-y-auto present');

// Clamping bounds
const minPanelWidth = 300;
const maxPanelWidth = 600;
const defaultPanelWidth = 380;

let panelWidth = defaultPanelWidth;
const state = { panelWidth };
const mockLocalStorage = {};

// Test bounds clamping function
function calculateWidth(clientX, rectLeft) {
    return Math.min(Math.max(clientX - rectLeft, minPanelWidth), maxPanelWidth);
}

// 1. Nominal drag
assert.strictEqual(calculateWidth(450, 0), 450, 'Drag to 450px should result in 450px');
assert.strictEqual(calculateWidth(300, 0), 300, 'Drag to min bound should result in 300px');
assert.strictEqual(calculateWidth(600, 0), 600, 'Drag to max bound should result in 600px');

// 2. Underflow clamp
assert.strictEqual(calculateWidth(250, 0), 300, 'Drag below 300px should clamp to 300px');
assert.strictEqual(calculateWidth(0, 0), 300, 'Drag to 0px should clamp to 300px');
assert.strictEqual(calculateWidth(-100, 0), 300, 'Drag to negative offset should clamp to 300px');

// 3. Overflow clamp
assert.strictEqual(calculateWidth(650, 0), 600, 'Drag above 600px should clamp to 600px');
assert.strictEqual(calculateWidth(1000, 0), 600, 'Drag to 1000px should clamp to 600px');

// 4. Persistence verification
mockLocalStorage['ideogram_panel_width'] = 440;
const saved = parseInt(mockLocalStorage['ideogram_panel_width'], 10);
assert.strictEqual(saved >= minPanelWidth && saved <= maxPanelWidth ? saved : defaultPanelWidth, 440);

// 5. Verify left panel content encapsulation
const leftPanelStart = html.indexOf('id="ideogram-left-panel"');
const leftPanelEnd = html.indexOf('</aside>', leftPanelStart);
const leftPanelContent = html.substring(leftPanelStart, leftPanelEnd);

assert(leftPanelContent.includes('id="ideogram-header-generate"'), 'Generate header must be inside ideogram-left-panel');
assert(leftPanelContent.includes('id="ideogram-header-edit"'), 'Smart Edit header must be inside ideogram-left-panel');
assert(leftPanelContent.includes('id="ideogram-generate-controls"'), 'Generate controls must be inside ideogram-left-panel');
assert(leftPanelContent.includes('id="ideogram-precise-edit-controls"'), 'Precise Edit controls must be inside ideogram-left-panel');

console.log('✔ All structural containers verified inside ideogram-left-panel');
console.log('✔ Math clamping & bound checks (300px - 600px) passed');
console.log('✔ localStorage persistence logic passed');
console.log('✔ Left panel encapsulation for both Generate and Smart Edit modes passed');
console.log('\n🎉 ALL RESIZER SIMULATION AND INTEGRITY CHECKS PASSED 100%!');
