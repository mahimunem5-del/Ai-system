const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING UI CLICK UNFREEZE & POINTER LOCK FIXES ===\n');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Verify CSS Fail-safe rule in <style>
console.log('1. Checking CSS fail-safe rules in <style>...');
assert.ok(html.includes('#studio-lightbox-modal.hidden'), 'CSS rule must target #studio-lightbox-modal.hidden');
assert.ok(html.includes('#gemini-chat-image-lightbox-modal.hidden'), 'CSS rule must target #gemini-chat-image-lightbox-modal.hidden');
assert.ok(html.includes('#studio-image-edit-modal.hidden'), 'CSS rule must target #studio-image-edit-modal.hidden');
assert.ok(html.includes('display: none !important;'), 'CSS rule must enforce display: none !important');
assert.ok(html.includes('pointer-events: none !important;'), 'CSS rule must enforce pointer-events: none !important');
console.log('✔ CSS fail-safe rule verified with display: none !important and pointer-events: none !important\n');

// 2. Verify Modal HTML initial declarations
console.log('2. Checking Modal markup declarations...');
const modalIds = [
    'studio-editor-modal',
    'studio-lightbox-modal',
    'gemini-chat-image-lightbox-modal',
    'studio-template-modal',
    'studio-image-edit-modal',
    'slides-template-modal'
];

for (const id of modalIds) {
    const regex = new RegExp(`<div id="${id}"[^>]*>`, 'i');
    const match = html.match(regex);
    assert.ok(match, `Element #${id} must exist in HTML`);
    const tagStr = match[0];
    assert.ok(tagStr.includes('hidden'), `Element #${id} must have 'hidden' class`);
    assert.ok(tagStr.includes('pointer-events-none'), `Element #${id} must have 'pointer-events-none' class`);
    assert.ok(tagStr.includes('style="display: none; pointer-events: none;"'), `Element #${id} must have inline style="display: none; pointer-events: none;"`);
    console.log(`✔ #${id} markup correctly declared with pointer-events-none and inline display: none`);
}
console.log('');

// 3. Verify JavaScript Modal Handlers
console.log('3. Checking JavaScript modal open/close functions...');

// closeStudioLightbox
assert.ok(html.includes('function closeStudioLightbox()'), 'closeStudioLightbox function must exist');
const closeStudioLightboxMatch = html.match(/function closeStudioLightbox\(\)\s*\{([\s\S]*?currentLightboxItem\s*=\s*null;\s*\})/);
assert.ok(closeStudioLightboxMatch, 'closeStudioLightbox implementation must be found');
const closeStudioLightboxCode = closeStudioLightboxMatch[1];
assert.ok(closeStudioLightboxCode.includes("modal.style.display = 'none'"), 'closeStudioLightbox must set modal.style.display = none');
assert.ok(closeStudioLightboxCode.includes("modal.style.pointerEvents = 'none'"), 'closeStudioLightbox must set modal.style.pointerEvents = none');
assert.ok(closeStudioLightboxCode.includes("document.body.style.overflow = ''"), 'closeStudioLightbox must reset body overflow');
assert.ok(closeStudioLightboxCode.includes("document.body.style.pointerEvents = ''"), 'closeStudioLightbox must reset body pointerEvents');
assert.ok(closeStudioLightboxCode.includes("modal.classList.add('hidden', 'pointer-events-none')"), 'closeStudioLightbox must add hidden and pointer-events-none classes');
console.log('✔ closeStudioLightbox cleanly sets display: none, pointerEvents: none, and clears body styles');

// openStudioLightbox
const openStudioLightboxMatch = html.match(/function openStudioLightbox\([^)]*\)\s*\{([\s\S]*?function updateLightboxContent)/);
assert.ok(openStudioLightboxMatch, 'openStudioLightbox implementation must be found');
const openStudioLightboxCode = openStudioLightboxMatch[1];
assert.ok(openStudioLightboxCode.includes("modal.style.display = 'flex'"), 'openStudioLightbox must set display = flex');
assert.ok(openStudioLightboxCode.includes("modal.style.pointerEvents = 'auto'"), 'openStudioLightbox must set pointerEvents = auto');
console.log('✔ openStudioLightbox correctly sets display: flex and pointerEvents: auto');

// closeGeminiChatImageViewer
const closeGeminiViewerMatch = html.match(/function closeGeminiChatImageViewer\(\)\s*\{([\s\S]*?currentChatLightboxState\s*=\s*null;\s*\})/);
assert.ok(closeGeminiViewerMatch, 'closeGeminiChatImageViewer implementation must be found');
const closeGeminiViewerCode = closeGeminiViewerMatch[1];
assert.ok(closeGeminiViewerCode.includes("modal.style.display = 'none'"), 'closeGeminiChatImageViewer must set modal.style.display = none');
assert.ok(closeGeminiViewerCode.includes("modal.style.pointerEvents = 'none'"), 'closeGeminiChatImageViewer must set modal.style.pointerEvents = none');
assert.ok(closeGeminiViewerCode.includes("document.body.style.overflow = ''"), 'closeGeminiChatImageViewer must reset body overflow immediately');
assert.ok(!closeGeminiViewerCode.includes('setTimeout'), 'closeGeminiChatImageViewer must not delay body overflow cleanup with setTimeout');
console.log('✔ closeGeminiChatImageViewer immediately resets body overflow and sets pointerEvents: none');

// exitStudioPreciseEdit
const exitPreciseEditMatch = html.match(/function exitStudioPreciseEdit\(\)\s*\{([\s\S]*?function openStudioImageEditModal)/);
assert.ok(exitPreciseEditMatch, 'exitStudioPreciseEdit implementation must be found');
const exitPreciseEditCode = exitPreciseEditMatch[1];
assert.ok(exitPreciseEditCode.includes('modal.style.display = "none"'), 'exitStudioPreciseEdit must set modal.style.display = none');
assert.ok(exitPreciseEditCode.includes('modal.style.pointerEvents = "none"'), 'exitStudioPreciseEdit must set modal.style.pointerEvents = none');
assert.ok(exitPreciseEditCode.includes("document.body.style.overflow = ''"), 'exitStudioPreciseEdit must reset body overflow');
console.log('✔ exitStudioPreciseEdit cleanly resets modal and body scroll state');

// switchWorkspace
const switchWorkspaceMatch = html.match(/function switchWorkspace\([^)]*\)\s*\{([\s\S]*?)\n\s*function hideAll/);
assert.ok(switchWorkspaceMatch, 'switchWorkspace implementation must be found');
const switchWorkspaceCode = switchWorkspaceMatch[1];
assert.ok(switchWorkspaceCode.includes('closeStudioLightbox()'), 'switchWorkspace must close lightbox');
assert.ok(switchWorkspaceCode.includes("document.body.style.overflow = ''"), 'switchWorkspace must ensure body overflow is unlocked');
console.log('✔ switchWorkspace ensures no orphaned modal or backdrop locks clicks when changing workspaces\n');

// 4. Verify Inline onclick Event Handlers
console.log('4. Checking inline onclick event handlers...');
assert.ok(html.includes("onclick=\"var e = event; if (e.target.closest('.image-chat-actions-bar')) return;"), 'Image container inline onclick must safely define e from event');
assert.ok(html.includes("onclick=\"var e = event; e.stopPropagation(); triggerSilentImageDownload("), 'Download button inline onclick must safely define e from event');
assert.ok(html.includes("onclick=\"var e = event; e.stopPropagation(); openStudioImageEditModal("), 'Edit button inline onclick must safely define e from event');
assert.ok(html.includes("onclick=\"var e = event; e.stopPropagation(); navigator.clipboard.writeText("), 'Copy button inline onclick must safely define e from event');
console.log('✔ All inline onclick handlers properly bind e = event to prevent ReferenceError\n');

// 5. Verify Safe Document Click Listener
console.log('5. Checking document click listeners...');
const docClickListenerMatch = html.match(/\/\/ 5\. Click outside & Escape dismissal[\s\S]*?document\.addEventListener\('click',\s*\(e\)\s*=>\s*\{([\s\S]*?)\}\);/);
assert.ok(docClickListenerMatch, 'Safe document click listener must be found without capture phase');
const docClickCode = docClickListenerMatch[1];
assert.ok(docClickCode.includes('if (!e.target) return;'), 'Click listener must check e.target');
assert.ok(docClickCode.includes('sortPopover && sortBtn'), 'Click listener must null-check sort elements before contains()');
assert.ok(docClickCode.includes('contextMenu && typeof contextMenu.contains === \'function\''), 'Click listener must null-check contextMenu before contains()');
console.log('✔ Document click listener verified safe and non-capturing\n');

// 6. Verify Backdrop Click Handlers
console.log('6. Checking backdrop click handlers...');
assert.ok(html.includes("lightboxModalEl.addEventListener('click'"), 'studio-lightbox-modal must have backdrop click handler');
assert.ok(html.includes("editModalEl.addEventListener('click'"), 'studio-image-edit-modal must have backdrop click handler');
assert.ok(html.includes("editorModalEl.addEventListener('click'"), 'studio-editor-modal must have backdrop click handler');
assert.ok(html.includes("templateModalEl.addEventListener('click'"), 'studio-template-modal must have backdrop click handler');
console.log('✔ All modals have backdrop click dismissal handlers\n');

console.log('🎉 ALL UI CLICK FREEZE & POINTER LOCK CHECKS PASSED 100%!');
