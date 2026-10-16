const fs = require('fs');
const assert = require('assert');

console.log('Testing Attachment Popover Menu (After removing Add to project)...');

const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  // 1. Menu Items & Structure
  ['attach-btn exists', html.includes('id="attach-btn"')],
  ['attach-dropdown exists', html.includes('id="attach-dropdown"')],
  ['opt-add-files exists', html.includes('id="opt-add-files"')],
  ['opt-create-images exists', html.includes('id="opt-create-images"')],
  ['opt-create-slides exists', html.includes('id="opt-create-slides"')],
  ['opt-web-search exists', html.includes('id="opt-web-search"')],
  ['opt-deep-research exists', html.includes('id="opt-deep-research"')],

  // Verified Removal of "Add to project" from attach menu
  ['opt-add-to-project does NOT exist', !html.includes('id="opt-add-to-project"')],
  ['attach-project-submenu does NOT exist', !html.includes('id="attach-project-submenu"')],
  ['attach-project-search does NOT exist', !html.includes('id="attach-project-search"')],
  ['attach-project-list does NOT exist', !html.includes('id="attach-project-list"')],
  ['attach-project-remove-btn does NOT exist', !html.includes('id="attach-project-remove-btn"')],
  ['openAttachProjectSubmenu does NOT exist', !html.includes('function openAttachProjectSubmenu')],
  ['closeAttachProjectSubmenu does NOT exist', !html.includes('function closeAttachProjectSubmenu')],

  // Labels check
  ['Label Add photos & files exists', html.includes('Add photos &amp; files') || html.includes('Add photos & files')],
  ['Label Create images exists', html.includes('Create images')],
  ['Label Create slides exists', html.includes('Create slides')],
  ['Label Web search exists', html.includes('Web search')],
  ['Label Deep research exists', html.includes('Deep research')],

  // 2. File input
  ['Native file picker input exists with multiple', html.includes('id="file-input-chat"') && html.includes('multiple')],

  // 3. JavaScript function definitions & exports
  ['toggleAttachDropdown function exists', html.includes('function toggleAttachDropdown()')],
  ['updateAttachDropdownPosition exists', html.includes('function updateAttachDropdownPosition()')],
  ['closeAttachDropdown function exists', html.includes('function closeAttachDropdown()')],

  // 4. Action wirings
  ['switchWorkspace image-studio called on optCreateImages', html.includes("switchWorkspace('image-studio')")],
  ['switchWorkspace slides-studio called on optCreateSlides', html.includes("switchWorkspace('slides-studio')")],
  ['selectSearchMode webSearch called on optWebSearch', html.includes("selectSearchMode('webSearch')")],
  ['selectSearchMode deepResearch called on optDeepResearch', html.includes("selectSearchMode('deepResearch')")],

  // 5. Outside click & Escape
  ['Outside click handles closeAttachDropdown', html.includes('attachWrapper') && html.includes('closeAttachDropdown()')],
  ['Escape key closes attachDropdown', html.includes("e.key === 'Escape'") && html.includes('closeAttachDropdown()')]
];

let allPassed = true;
checks.forEach(([desc, passed]) => {
  if (passed) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
}

console.log(`\nAll ${checks.length} tests passed successfully!`);
