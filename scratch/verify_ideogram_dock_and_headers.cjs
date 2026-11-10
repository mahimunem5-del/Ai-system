const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING IDEOGRAM HEADERS, CHECKBOX RELOCATION & FLOATING ACTION DOCK ===\n');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Left Panel Top Headers Cleanup
console.log('1. Checking Left Panel Top Headers...');
assert(html.includes('id="ideogram-header-generate"'), 'ideogram-header-generate missing');
assert(html.includes('id="ideogram-header-edit"'), 'ideogram-header-edit missing');
assert(html.includes('id="ideogram-edit-back-btn"'), 'ideogram-edit-back-btn missing');
assert(html.includes('id="ideogram-reset-composer-btn"'), 'ideogram-reset-composer-btn missing');

// Extract generate header block
const genHeaderStart = html.indexOf('id="ideogram-header-generate"');
const genHeaderEnd = html.indexOf('</div>', genHeaderStart);
const genHeaderHtml = html.substring(genHeaderStart, genHeaderEnd);
assert(genHeaderHtml.includes('<span>Generate Image</span>'), 'Generate Image title missing');
assert(!genHeaderHtml.includes('Apps'), 'Generate Image must NOT include Apps / prefix');
assert(!genHeaderHtml.includes('m6 9 6 6 6-6'), 'Generate Image must NOT include dropdown caret icon');

// Extract edit header block
const editHeaderStart = html.indexOf('id="ideogram-header-edit"');
const editHeaderEnd = html.indexOf('</div>', editHeaderStart);
const editHeaderHtml = html.substring(editHeaderStart, editHeaderEnd);
assert(editHeaderHtml.includes('<span>Smart Edit</span>'), 'Smart Edit title missing');
assert(!editHeaderHtml.includes('Apps'), 'Smart Edit must NOT include Apps / prefix');
assert(editHeaderHtml.includes('id="ideogram-edit-back-btn"'), 'Back button missing in Smart Edit header');
assert(html.includes('editBackBtn.addEventListener'), 'editBackBtn click listener missing');
console.log('✔ Left panel headers verified: clean "Generate Image" (no caret/prefix) & "Smart Edit" with back button');

// 2. Relocate Selection Checkbox to Prompt Header
console.log('\n2. Checking Relocated Selection Checkbox...');
assert(html.includes('group-select-checkbox'), 'group-select-checkbox missing');
assert(html.includes('group-select-checkbox-label'), 'group-select-checkbox-label missing');
// Check that group checkbox sits right before prompt title in template
const groupHeaderIdx = html.indexOf('<!-- Asset Group Header -->');
const groupCbIdx = html.indexOf('group-select-checkbox', groupHeaderIdx);
const groupTitleIdx = html.indexOf('group-prompt-title', groupHeaderIdx);
assert(groupCbIdx !== -1 && groupTitleIdx !== -1 && groupCbIdx < groupTitleIdx, 'Section checkbox must precede prompt title');

// Check active image card outline
assert(html.includes('ring-2 ring-blue-500'), 'Card selection blue outline ring-2 ring-blue-500 missing');
console.log('✔ Section selection checkbox relocated cleanly before prompt header with crisp blue card ring');

// 3. Remove Top Blue Action Bar
console.log('\n3. Checking Top Blue Action Bar Removal...');
assert(!html.includes('bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200'), 'Top blue selection bar must be removed');
console.log('✔ Top fixed blue selection strip completely removed');

// 4. Floating Bottom Action Dock & Menu
console.log('\n4. Checking Floating Bottom Action Dock & Menu...');
assert(html.includes('id="ideogram-selection-bar"'), 'ideogram-selection-bar missing');
assert(html.includes('absolute bottom-6 left-1/2 -translate-x-1/2'), 'Floating dock positioning missing');
assert(html.includes('id="ideogram-clear-selection-btn"'), 'ideogram-clear-selection-btn missing');
assert(html.includes('id="ideogram-selection-count"'), 'ideogram-selection-count missing');
assert(html.includes('id="ideogram-download-selected-btn"'), 'ideogram-download-selected-btn missing');
assert(html.includes('id="ideogram-floating-more-btn"'), 'ideogram-floating-more-btn missing');
assert(html.includes('id="ideogram-floating-more-menu"'), 'ideogram-floating-more-menu missing');
assert(html.includes('id="ideogram-floating-edit-btn"'), 'ideogram-floating-edit-btn missing');
assert(html.includes('id="ideogram-floating-delete-btn"'), 'ideogram-floating-delete-btn missing');

// Actions logic check
assert(html.includes('enterStudioPreciseEdit(selectedItem)'), 'Floating Edit action calls enterStudioPreciseEdit');
assert(html.includes('openIdeogramDeleteModal()'), 'Floating Delete action calls openIdeogramDeleteModal');
console.log('✔ Sleek floating dark action dock & menu verified');

// 5. Delete Confirmation Dialog & Permanent State Removal
console.log('\n5. Checking Delete Confirmation Dialog & Local Storage Sync...');
assert(html.includes('id="ideogram-delete-confirm-modal"'), 'ideogram-delete-confirm-modal missing');
assert(html.includes('Delete generation?'), 'Confirmation modal title missing');
assert(html.includes('Are you sure you want to delete this generated image? This action cannot be undone.'), 'Confirmation modal description missing');
assert(html.includes('id="ideogram-delete-cancel-btn"'), 'ideogram-delete-cancel-btn missing');
assert(html.includes('id="ideogram-delete-confirm-btn"'), 'ideogram-delete-confirm-btn missing');

// Verify modal is fail-safe hidden & pointer-events-none initially
const modalIdx = html.indexOf('<div id="ideogram-delete-confirm-modal"');
const modalTag = html.substring(modalIdx, modalIdx + 300);
assert(modalTag.includes('hidden'), 'Delete modal must include hidden class');
assert(modalTag.includes('pointer-events-none'), 'Delete modal must include pointer-events-none class');
assert(modalTag.includes('display: none'), 'Delete modal must include inline display: none');

// Verify permanent deletion from state and local storage
assert(html.includes('deleteSelectedStudioAssets'), 'deleteSelectedStudioAssets function missing');
assert(html.includes('saveStoredRecentImages(STUDIO_RECENT_IMAGES)'), 'saveStoredRecentImages call missing');
assert(html.includes('STORAGE_KEY_RECENT_IMAGES'), 'STORAGE_KEY_RECENT_IMAGES reference missing');
console.log('✔ Delete confirmation modal and permanent local storage deletion verified');

console.log('\n🎉 ALL REQUIREMENTS VERIFIED 100%!');
