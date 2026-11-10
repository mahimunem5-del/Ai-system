const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log('=== VERIFYING FINAL IMAGE ACTIONS UI POLISH ===');

// Check 1: Action toolbar inside image container
const hasActionsBarInside = html.includes('image-chat-actions-bar absolute bottom-3 left-3');
console.log('1. Action toolbar placed directly inside image container at bottom-left:', hasActionsBarInside);

// Check 2: Separate row below image is removed
const hasOldItemWrapper = html.includes('image-chat-item-wrapper');
console.log('2. Separate row below image removed (should be false):', hasOldItemWrapper);

// Check 3: Download, Edit, Copy inside image
const hasDownloadBtn = html.includes('image-chat-btn-download');
const hasEditBtn = html.includes('image-chat-btn-edit');
const hasCopyImgBtn = html.includes('image-chat-btn-copy');

console.log('3. Has Download action in toolbar:', hasDownloadBtn);
console.log('3. Has Edit action in toolbar:', hasEditBtn);
console.log('3. Has Copy action in toolbar:', hasCopyImgBtn);

// Check 4: Assistant text response has separate Copy and Share actions
const hasAsstCopy = html.includes('btn-asst-copy');
const hasAsstShare = html.includes('btn-asst-share');

console.log('4. Assistant response has separate Copy action:', hasAsstCopy);
console.log('4. Assistant response has separate Share action:', hasAsstShare);

// Check 5: Image click directly opens preview and toolbar doesn't trigger preview
const hasGuardCheck = html.includes("if (e.target.closest('.image-chat-actions-bar')) return;");
const hasLightboxCall = html.includes('openStudioLightbox({');

console.log('5. Clicking image directly opens lightbox preview:', hasLightboxCall);
console.log('5. Toolbar clicks guarded against triggering preview:', hasGuardCheck);

// Check 6: Hover effect on toolbar
const hasHoverTransition = html.includes('opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-opacity');
console.log('6. Toolbar has subtle hover effect without permanently covering image:', hasHoverTransition);

if (!hasActionsBarInside || hasOldItemWrapper || !hasDownloadBtn || !hasEditBtn || !hasCopyImgBtn || !hasAsstCopy || !hasAsstShare || !hasGuardCheck || !hasHoverTransition) {
    console.error('❌ VALIDATION FAILED!');
    process.exit(1);
}

console.log('\n🎉 ALL FINAL IMAGE ACTIONS UI VERIFICATIONS PASSED!');

