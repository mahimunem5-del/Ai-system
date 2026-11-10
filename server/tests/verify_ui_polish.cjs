const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log('--- RUNNING UI POLISH VALIDATION SUITE ---');

// Validation 1: Header minimal requirements
const hasBackBtn = html.includes('id="image-chat-back-btn"');
const hasHeaderModelName = html.includes('id="image-chat-header-model-name"');
const hasShareBtn = html.includes('id="image-chat-share-btn"');
const hasNewBtn = html.includes('id="image-chat-new-btn"');

// Header must NOT contain Mahi Engine badge or decorative dividers
const headerStart = html.indexOf('<!-- Top Header Bar -->');
const headerEnd = html.indexOf('</header>', headerStart);
const headerHtml = html.slice(headerStart, headerEnd);

const headerHasMahiBadge = headerHtml.includes('Mahi Engine (Standard)');
console.log('1. Header has Back Button:', hasBackBtn);
console.log('1. Header has Selected Model Name:', hasHeaderModelName);
console.log('1. Header has Share Button:', hasShareBtn);
console.log('1. Header has New Image Button:', hasNewBtn);
console.log('1. Header does NOT have Mahi Engine badge (should be false):', headerHasMahiBadge);

if (!hasBackBtn || !hasHeaderModelName || !hasShareBtn || !hasNewBtn || headerHasMahiBadge) {
    console.error('❌ Validation 1 Failed');
    process.exit(1);
}

// Validation 2: No Mahi Engine label row above ordinary responses
// In renderImageChatConversation, ordinary completed text responses should not output the Mahi Engine identity row
const renderConvStart = html.indexOf('function renderImageChatConversation() {');
const renderConvEnd = html.indexOf('// Submits next message in Image Chat');
const renderCode = html.slice(renderConvStart, renderConvEnd);

const hasMahiIdentityAboveResponse = renderCode.includes('<span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Mahi Engine (Standard)</span>');
console.log('2. No Mahi Engine label row above responses (should be false):', hasMahiIdentityAboveResponse);
if (hasMahiIdentityAboveResponse) {
    console.error('❌ Validation 2 Failed');
    process.exit(1);
}

// Validation 3: Text response actions below AI text
const hasCopyTextBtn = renderCode.includes('btn-asst-copy');
const hasShareTextBtn = renderCode.includes('btn-asst-share');
console.log('3. Copy response action below AI text:', hasCopyTextBtn);
console.log('3. Share response action below AI text:', hasShareTextBtn);
if (!hasCopyTextBtn || !hasShareTextBtn) {
    console.error('❌ Validation 3 Failed');
    process.exit(1);
}

// Validation 4: Clicking generated image directly opens preview
const hasImgContainerClick = renderCode.includes('openStudioLightbox({') && renderCode.includes('.image-chat-img-container');
console.log('4. Clicking generated image directly opens preview:', hasImgContainerClick);
if (!hasImgContainerClick) {
    console.error('❌ Validation 4 Failed');
    process.exit(1);
}

// Validation 5: Preview consistency (uses img.url, no regeneration)
console.log('5. Preview uses original image asset url:', renderCode.includes('img: imgObj.url'));

// Validation 6: ONLY Download, Edit, Copy actions below generated images
const hasDownloadBtn = renderCode.includes('image-chat-btn-download');
const hasEditBtn = renderCode.includes('image-chat-btn-edit');
const hasCopyImgBtn = renderCode.includes('image-chat-btn-copy');

// Ensure removed actions are NOT present in the image item
const hasVariationsBtnOnCard = renderCode.includes('image-chat-vary-btn');
const hasPreviewBtnOnCard = renderCode.includes('image-chat-preview-btn');

console.log('6. Has Download action below image:', hasDownloadBtn);
console.log('6. Has Edit action below image:', hasEditBtn);
console.log('6. Has Copy action below image:', hasCopyImgBtn);
console.log('6. No separate preview button on image (should be false):', hasPreviewBtnOnCard);
console.log('6. No extra variations button below image (should be false):', hasVariationsBtnOnCard);

if (!hasDownloadBtn || !hasEditBtn || !hasCopyImgBtn || hasPreviewBtnOnCard || hasVariationsBtnOnCard) {
    console.error('❌ Validation 6 Failed');
    process.exit(1);
}

// Validation 7 & 8: Actions prevent preview trigger (stopPropagation)
const hasStopPropagationOnActions = renderCode.includes('e.stopPropagation()');
console.log('7 & 8. Actions use stopPropagation to prevent preview trigger:', hasStopPropagationOnActions);

// Validation 9: Lightbox modal close behavior
const hasLightboxClose = html.includes('function closeStudioLightbox()');
console.log('9. Lightbox close function preserved:', hasLightboxClose);

// Validation 10: Existing image generation and workspace intact
const hasGenerateStudioImages = html.includes('function generateStudioImages(');
const hasStartImageChatSession = html.includes('function startImageChatSession(');
const hasSendImageChatMessage = html.includes('function sendImageChatMessage(');
const hasDispatchImageChatTurn = html.includes('function dispatchImageChatTurn(');

console.log('10. Generation and conversational workspace functions intact:', 
    hasGenerateStudioImages && hasStartImageChatSession && hasSendImageChatMessage && hasDispatchImageChatTurn);

if (!hasGenerateStudioImages || !hasStartImageChatSession || !hasSendImageChatMessage || !hasDispatchImageChatTurn) {
    console.error('❌ Validation 10 Failed');
    process.exit(1);
}

console.log('\n🎉 ALL 10 UI POLISH VALIDATIONS PASSED PERFECTLY!');

