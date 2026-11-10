const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING IDEOGRAM CONTROLS & GENERATION PARAMETERS ===');

const html = fs.readFileSync('index.html', 'utf8');
const controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// 1. Reference Images Upload Slots
assert(html.includes('id="ideogram-ref-slots-container"'), 'Reference slots container present in HTML');
assert(html.includes('id="ideogram-ref-dropzone"'), 'Reference dropzone present');
assert(html.includes('id="ideogram-ref-status"'), 'Reference status text present');
assert(html.includes('function renderStudioReferenceSlots()'), 'renderStudioReferenceSlots function implemented');
assert(html.includes('object-cover w-full h-full rounded-lg'), 'Uploaded reference renders with crisp object-cover and rounded-lg');
assert(html.includes('btn-remove-ref-slot'), 'Hover remove (×) button present on reference slot');
assert(html.includes('group-hover:opacity-100'), 'Remove button visible on hover');

// 2. Style Presets State & AI Integration
const requiredStyles = ['Auto', 'General', 'Realistic', 'Design', '3D Render', 'Anime', 'Cinematic', 'Illustration', 'Typography'];
requiredStyles.forEach(st => {
    assert(html.includes(`data-style="${st}"`), `Style preset button for ${st} present`);
});
assert(html.includes('imageStudioState.activeStyle = pill.dataset.style;'), 'Style pill updates imageStudioState.activeStyle');
assert(html.includes('style: activeStyle,'), 'Client attaches active style to generation payload');
assert(controllerCode.includes('const activeStyle = (style || templateStyle || template || \'\').trim();'), 'Backend extracts active style from payload');
assert(controllerCode.includes('finalPrompt = `${finalPrompt}, in ${activeStyle} aesthetic style, highly detailed, photorealistic`;'), 'Backend injects active style into final prompt');

// 3. Aspect Ratio Popover List & Wireframes
const requiredRatios = ['1:1', '2:3', '3:4', '9:16', '3:2', '4:3', '16:9', 'auto'];
requiredRatios.forEach(r => {
    assert(html.includes(`data-ratio="${r}"`), `Ratio option for ${r} present`);
});
assert(html.includes('studio-ratio-wireframe'), 'Proportional wireframe boxes present in ratio options');
assert(html.includes('studio-ratio-check'), 'Checkmark icon present for ratio selection');
assert(controllerCode.includes("'2:3': { width: 832, height: 1248, aspect_ratio: '2:3' }"), 'Backend supports 2:3 aspect ratio');
assert(controllerCode.includes("'3:2': { width: 1248, height: 832, aspect_ratio: '3:2' }"), 'Backend supports 3:2 aspect ratio');

// 4. Variations Dropdown Update
// Ensure Auto (4) is removed from #studio-count-dropdown
const startCountDropdown = html.indexOf('id="studio-count-dropdown"');
const endCountDropdown = html.indexOf('</div>\n                </div>\n            </div>\n\n            <!-- 6. ADVANCED SETTINGS');
assert(startCountDropdown !== -1 && endCountDropdown !== -1, 'Count dropdown boundaries found');
const countDropdownCode = html.slice(startCountDropdown, endCountDropdown);

assert(!countDropdownCode.includes('Auto (4)'), 'Auto (4) completely removed from studio-count-dropdown list');
assert(countDropdownCode.includes('data-count="1"'), 'Count option 1 present');
assert(countDropdownCode.includes('data-count="2"'), 'Count option 2 present');
assert(countDropdownCode.includes('data-count="3"'), 'Count option 3 present');
assert(countDropdownCode.includes('data-count="4"'), 'Count option 4 present');
assert(html.includes('<span id="studio-count-label" class="font-medium truncate">1 (1 image)</span>'), 'Default count label is 1 (1 image)');

// 5. Advanced Settings Cleanup
const startAdvContent = html.indexOf('id="ideogram-advanced-content"');
const endAdvContent = html.indexOf('id="studio-generate-btn"');
assert(startAdvContent !== -1 && endAdvContent !== -1, 'Advanced settings boundaries found');
const advCode = html.slice(startAdvContent, endAdvContent);

assert(!advCode.includes('<textarea id="ideogram-negative-prompt"'), 'Negative prompt textarea completely removed from advanced content');
assert(advCode.includes('id="ideogram-seed-input"'), 'Seed input control retained in advanced settings');
assert(advCode.includes('id="ideogram-seed-random-btn"'), 'Seed randomizer button retained');
assert(html.includes('seed: seedVal,'), 'Seed value forwarded in generation payload');
assert(controllerCode.includes('payload.seed = parseInt(seed, 10);'), 'Backend accepts and assigns seed into model payload');

console.log('✔ All 5 Ideogram UX parameter and control requirements verified 100%!');
