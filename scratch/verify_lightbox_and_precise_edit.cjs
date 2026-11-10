const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING LIGHTBOX CLEANUP & PRECISE EDIT INTEGRATION ===\n');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verify Lightbox Markup
console.log('1. Checking Lightbox Modal Cleanup...');
assert(html.includes('id="studio-lightbox-modal"'), 'studio-lightbox-modal missing');
assert(html.includes('id="studio-lightbox-download-btn"'), 'studio-lightbox-download-btn missing');
assert(html.includes('id="studio-lightbox-close-btn"'), 'studio-lightbox-close-btn missing');
assert(html.includes('id="studio-lightbox-counter"'), 'studio-lightbox-counter missing');
assert(html.includes('id="studio-lightbox-model"'), 'studio-lightbox-model missing');
assert(html.includes('id="studio-lightbox-ratio"'), 'studio-lightbox-ratio missing');
assert(html.includes('id="studio-lightbox-title"'), 'studio-lightbox-title missing');
assert(html.includes('id="studio-lightbox-prompt-caption"'), 'studio-lightbox-prompt-caption missing');

// Verify visible top bar section in studio-lightbox-modal
const startTopBar = html.indexOf('id="studio-lightbox-modal"');
const endTopBar = html.indexOf('id="studio-lightbox-backdrop"');
assert(startTopBar !== -1 && endTopBar !== -1, 'Lightbox top bar boundaries found');
const topBarHtml = html.substring(startTopBar, endTopBar);

// Check that visible action section contains download & close
assert(topBarHtml.includes('id="studio-lightbox-download-btn"'), 'Download button present in top bar');
assert(topBarHtml.includes('id="studio-lightbox-close-btn"'), 'Close button present in top bar');

// Check that removed buttons are in hidden compatibility container
const compatDivStart = topBarHtml.indexOf('<div class="hidden" aria-hidden="true">');
assert(compatDivStart !== -1, 'Hidden compatibility div present');
const compatBlock = topBarHtml.substring(compatDivStart, topBarHtml.indexOf('</div>', compatDivStart));

assert(compatBlock.includes('id="studio-lightbox-reuse-btn"'), 'Reuse button in hidden compatibility block');
assert(compatBlock.includes('id="studio-lightbox-regenerate-btn"'), 'Regenerate button in hidden compatibility block');
assert(compatBlock.includes('id="studio-lightbox-share-btn"'), 'Share button in hidden compatibility block');
assert(compatBlock.includes('id="studio-lightbox-copy-btn"'), 'Copy button in hidden compatibility block');

// Ensure visible top bar doesn't have non-hidden reuse/regenerate/share/copy
const visibleActionHtml = topBarHtml.replace(compatBlock, '');
assert(!visibleActionHtml.includes('id="studio-lightbox-reuse-btn"'), 'Reuse button not in visible top bar');
assert(!visibleActionHtml.includes('id="studio-lightbox-regenerate-btn"'), 'Regenerate button not in visible top bar');
assert(!visibleActionHtml.includes('id="studio-lightbox-share-btn"'), 'Share button not in visible top bar');
assert(!visibleActionHtml.includes('id="studio-lightbox-copy-btn"'), 'Copy button not in visible top bar');

console.log('✔ Lightbox top action bar cleaned up: visible bar contains ONLY Download and Close');

// 2. Verify Precise Edit Markup
console.log('\n2. Checking Ideogram Precise Edit Markup...');
// Header
assert(html.includes('id="ideogram-header-generate"'), 'ideogram-header-generate missing');
assert(html.includes('id="ideogram-header-edit"'), 'ideogram-header-edit missing');
assert(html.includes('<span>Smart Edit</span>'), 'Smart Edit title missing');
assert(html.includes('id="ideogram-reset-composer-btn"'), 'ideogram-reset-composer-btn missing');

// View Containers
assert(html.includes('id="ideogram-generate-controls"'), 'ideogram-generate-controls missing');
assert(html.includes('id="ideogram-precise-edit-controls"'), 'ideogram-precise-edit-controls missing');

// Source image card
assert(html.includes('id="studio-precise-edit-thumb"'), 'studio-precise-edit-thumb missing');
assert(html.includes('id="studio-precise-edit-source-title"'), 'studio-precise-edit-source-title missing');
assert(html.includes('id="studio-precise-edit-remove-src-btn"'), 'studio-precise-edit-remove-src-btn missing');
assert(!html.includes('id="studio-precise-edit-mask-btn"'), 'studio-precise-edit-mask-btn should be removed');
assert(!html.includes('Mask & context window'), 'Mask & context window text should be removed');

// Edit prompt box
assert(html.includes('id="studio-precise-edit-input"'), 'studio-precise-edit-input missing');
assert(html.includes('What should change?'), 'What should change? label missing');
assert(html.includes('placeholder="Describe the change you want..."'), 'Describe the change you want... placeholder missing');
assert(html.includes('id="studio-precise-edit-error"'), 'studio-precise-edit-error missing');

// Reference slots
assert(html.includes('id="studio-precise-edit-ref-section"'), 'studio-precise-edit-ref-section missing');
assert(html.includes('id="studio-precise-edit-ref-slots"'), 'studio-precise-edit-ref-slots missing');
assert(html.includes('id="studio-precise-edit-ref-status"'), 'studio-precise-edit-ref-status missing');
assert(html.includes('id="studio-precise-edit-ref-dropzone"'), 'studio-precise-edit-ref-dropzone missing');
assert(html.includes('id="studio-precise-edit-ref-input"'), 'studio-precise-edit-ref-input missing');

// Quality / Edit weight dropdown
assert(html.includes('id="studio-precise-edit-weight-btn"'), 'studio-precise-edit-weight-btn missing');
assert(html.includes('id="studio-precise-edit-weight-label"'), 'studio-precise-edit-weight-label missing');
assert(html.includes('id="studio-precise-edit-weight-dropdown"'), 'studio-precise-edit-weight-dropdown missing');
assert(html.includes('data-weight="Low"'), 'weight Low missing');
assert(html.includes('data-weight="Medium"'), 'weight Medium missing');
assert(html.includes('data-weight="High"'), 'weight High missing');

// Variations dropdown
assert(html.includes('id="studio-precise-edit-count-btn"'), 'studio-precise-edit-count-btn missing');
assert(html.includes('id="studio-precise-edit-count-label"'), 'studio-precise-edit-count-label missing');
assert(html.includes('id="studio-precise-edit-count-dropdown"'), 'studio-precise-edit-count-dropdown missing');
assert(html.includes('data-count="1"'), 'count 1 missing');
assert(html.includes('data-count="2"'), 'count 2 missing');
assert(html.includes('data-count="3"'), 'count 3 missing');
assert(html.includes('data-count="4"'), 'count 4 missing');

// Apply edit button
assert(html.includes('id="studio-apply-precise-edit-btn"'), 'studio-apply-precise-edit-btn missing');
assert(html.includes('id="studio-apply-precise-edit-text"'), 'studio-apply-precise-edit-text missing');
assert(html.includes('Apply edit'), 'Apply edit text missing');

console.log('✔ Ideogram Precise Edit panel components verified');

// 3. Verify JavaScript Logic & Function Implementations
console.log('\n3. Checking JavaScript Handlers & Workflow...');
assert(html.includes('function enterStudioPreciseEdit(item, cardEl)'), 'enterStudioPreciseEdit function implemented');
assert(html.includes('function exitStudioPreciseEdit()'), 'exitStudioPreciseEdit function implemented');
assert(html.includes('function applyStudioPreciseEdit()'), 'applyStudioPreciseEdit function implemented');
assert(html.includes('function renderStudioPreciseEditReferenceSlots()'), 'renderStudioPreciseEditReferenceSlots function implemented');

// Check that openStudioImageEditModal switches to Precise Edit mode
assert(html.includes('enterStudioPreciseEdit(item, cardEl);'), 'openStudioImageEditModal calls enterStudioPreciseEdit');

// Check that Clear all restores Generate mode
assert(html.includes('if (studioPreciseEditState && studioPreciseEditState.isActive) {'), 'Clear all button checks edit mode');
assert(html.includes('exitStudioPreciseEdit();'), 'Clear all calls exitStudioPreciseEdit');

// Check that applyStudioPreciseEdit packages source image & prompt
assert(html.includes('const sourceUrl = sourceItem.url || sourceItem.img;'), 'applyStudioPreciseEdit gets sourceUrl');
assert(html.includes('generateStudioImages(packagedPrompt, sourceRatio, sourceUrl);'), 'applyStudioPreciseEdit calls generateStudioImages');

// Check dropdowns included in closeAllStudioDropdowns
assert(html.includes("document.getElementById('studio-precise-edit-weight-dropdown')"), 'weight dropdown in closeAllStudioDropdowns');
assert(html.includes("document.getElementById('studio-precise-edit-count-dropdown')"), 'count dropdown in closeAllStudioDropdowns');

// Check outside click handler includes wrappers
assert(html.includes("!e.target.closest('#studio-precise-weight-wrapper')"), 'outside click checks weight wrapper');
assert(html.includes("!e.target.closest('#studio-precise-count-wrapper')"), 'outside click checks count wrapper');

// Check event listeners wired
assert(html.includes('document.getElementById("studio-precise-edit-remove-src-btn")'), 'remove source button listener wired');
assert(html.includes('document.getElementById("studio-apply-precise-edit-btn")'), 'apply precise edit listener wired');
assert(html.includes('document.getElementById("studio-precise-edit-weight-btn")'), 'weight button listener wired');
assert(html.includes('document.getElementById("studio-precise-edit-count-btn")'), 'count button listener wired');
assert(html.includes('document.getElementById("studio-precise-edit-ref-input")'), 'ref input listener wired');

console.log('✔ Precise Edit JavaScript handlers, state management, and workflow verified');

console.log('\n🎉 ALL LIGHTBOX & PRECISE EDIT REQUIREMENTS VERIFIED 100%!');
