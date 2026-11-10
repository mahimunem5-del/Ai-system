const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING RESULT HEADER RAW PROMPT VS COPY ACTION ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Check renderStudioAssetsGallery function boundaries
const startGallery = html.indexOf('function renderStudioAssetsGallery()');
const endGallery = html.indexOf('function applyParametersToLeftPanel');
assert(startGallery !== -1 && endGallery !== -1, 'renderStudioAssetsGallery boundaries found');

const galleryCode = html.slice(startGallery, endGallery);

// 2. Check displayPrompt definition
assert(galleryCode.includes('const displayPrompt = group.originalPrompt || (group.images && group.images[0] && group.images[0].originalPrompt) || group.prompt;'),
    'displayPrompt prioritizes originalPrompt and falls back cleanly to group.prompt');

// 3. Check header title rendering
assert(galleryCode.includes('${escapeHtml(displayPrompt)}'),
    'Group card header renders displayPrompt inside title');
assert(galleryCode.includes('group-prompt-title'),
    'group-prompt-title class preserved');

// 4. Verify groupStudioAssets definition
const startGroup = html.indexOf('function groupStudioAssets(');
const endGroup = html.indexOf('function formatAssetTimestamp(');
assert(startGroup !== -1 && endGroup !== -1, 'groupStudioAssets boundaries found');

const groupCode = html.slice(startGroup, endGroup);
assert(groupCode.includes('originalPrompt: img.originalPrompt || img.rawPrompt || \'\','),
    'groupStudioAssets captures originalPrompt from img object');
assert(groupCode.includes('enhancedPrompt: img.enhancedPrompt || img.prompt || \'\','),
    'groupStudioAssets captures enhancedPrompt');

// 5. Verify Copy Prompt button on image card still copies enhanced prompt
const startCard = html.indexOf('card.className = `ideogram-variation-card');
const endCard = html.indexOf('variationsGrid.appendChild(card);', startCard);
assert(startCard !== -1 && endCard !== -1, 'Variation card boundaries found');

const cardCode = html.slice(startCard, endCard);
assert(cardCode.includes('const enhancedText = imgObj.enhancedPrompt || imgObj.prompt || group.enhancedPrompt || group.prompt;'),
    'Copy Prompt button retains enhancedPrompt priority logic');
assert(cardCode.includes('const promptToCopy = enhancedText || originalText || \'\';'),
    'promptToCopy prioritized');
assert(cardCode.includes('showStudioToast(\'Enhanced prompt copied!\');'),
    'Toast feedback preserved');

// 6. Test logic simulation
function simulateTitleResolution(imgObj) {
    const group = {
        prompt: imgObj.prompt,
        enhancedPrompt: imgObj.enhancedPrompt || imgObj.prompt,
        originalPrompt: imgObj.originalPrompt || imgObj.rawPrompt || '',
        images: [imgObj]
    };
    const displayPrompt = group.originalPrompt || (group.images && group.images[0] && group.images[0].originalPrompt) || group.prompt;
    const promptToCopy = imgObj.enhancedPrompt || imgObj.prompt || group.enhancedPrompt || group.prompt || group.originalPrompt || '';
    return { displayPrompt, promptToCopy };
}

// Case A: User generated image with enhanced Mahi Engine prompt
const sampleA = {
    originalPrompt: 'Make a chota bheem cartoon image',
    prompt: 'Vibrant, ultra-detailed 3D animated scene of Chhota Bheem wearing his iconic yellow dhoti and red wristbands, standing heroically with a warm smile in the village of Dholakpur, volumetric cinematic lighting, Pixar and DreamWorks style rendering, 8k resolution',
    enhancedPrompt: 'Vibrant, ultra-detailed 3D animated scene of Chhota Bheem wearing his iconic yellow dhoti and red wristbands, standing heroically with a warm smile in the village of Dholakpur, volumetric cinematic lighting, Pixar and DreamWorks style rendering, 8k resolution'
};
const resA = simulateTitleResolution(sampleA);
assert.strictEqual(resA.displayPrompt, 'Make a chota bheem cartoon image', 'Header displays clean original raw prompt');
assert.strictEqual(resA.promptToCopy, sampleA.enhancedPrompt, 'Copy action copies full Mahi Engine upgraded prompt');

// Case B: Legacy image without originalPrompt
const sampleB = {
    prompt: 'A futuristic electric hypercar in neon Tokyo rain'
};
const resB = simulateTitleResolution(sampleB);
assert.strictEqual(resB.displayPrompt, 'A futuristic electric hypercar in neon Tokyo rain', 'Header cleanly falls back to prompt when originalPrompt is missing');
assert.strictEqual(resB.promptToCopy, sampleB.prompt, 'Copy action copies prompt');

console.log('✔ All result header raw prompt and copy retention tests passed 100%!');

