const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== VERIFYING IMAGE CARD OVERLAY BUTTONS ===');

// Check the card template inside renderStudioAssetsGallery
const startIdx = html.indexOf('card.className = `ideogram-variation-card');
const endIdx = html.indexOf('variationsGrid.appendChild(card);', startIdx);
assert(startIdx !== -1 && endIdx !== -1, 'Variation card template boundaries found');

const cardCode = html.slice(startIdx, endIdx);

// 1. Target 3 clean buttons
assert(cardCode.includes('btn-card-download'), 'Download button present on card');
assert(cardCode.includes('btn-card-copy-prompt'), 'Copy Prompt button present on card');
assert(cardCode.includes('btn-card-edit'), 'Edit button present on card');
assert(!cardCode.includes('btn-card-reference'), 'Old reference button removed from card overlay');

// 2. Styling verification (semi-transparent dark pill + active:scale-90 micro-interaction)
assert(cardCode.includes('bg-black/50 hover:bg-black/75 active:scale-90'), 'Consistent semi-transparent dark pill background + active:scale-90 styling applied');

// 3. Checkmark icon swap
assert(cardCode.includes('copy-icon-default'), 'Default copy icon present');
assert(cardCode.includes('copy-icon-success'), 'Success checkmark icon present');

// 4. Top-left checkbox, top-right aspect ratio badge, bottom-left badge intact
assert(cardCode.includes('variation-checkbox'), 'Checkbox on top-left intact');
assert(cardCode.includes('${escapeHtml(group.aspectRatio)}'), 'Aspect ratio badge on top-right intact');
assert(cardCode.includes('#${idx + 1}'), '# index badge on bottom-left intact');

// 5. Copy Prompt logic verification
assert(cardCode.includes('card.querySelector(\'.btn-card-copy-prompt\')'), 'Copy prompt event listener attached');
assert(cardCode.includes('const enhancedText = imgObj.enhancedPrompt || imgObj.prompt || group.enhancedPrompt || group.prompt;'), 'Copies enhanced prompt or falls back');
assert(cardCode.includes('showStudioToast(\'Enhanced prompt copied!\')'), 'Shows enhanced prompt copied toast notification');

console.log('✔ All image card overlay button requirements verified 100%!');
