const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== VERIFYING RESULT HEADER BUTTONS ===');

const galleryStart = html.indexOf('function renderStudioAssetsGallery()');
const galleryEnd = html.indexOf('function applyParametersToLeftPanel');
assert(galleryStart !== -1 && galleryEnd !== -1, 'Function boundaries found');
const galleryCode = html.slice(galleryStart, galleryEnd);

assert(galleryCode.includes('btn-group-regenerate p-2 rounded-lg'), 'Minimal regenerate icon button present');
assert(galleryCode.includes('btn-group-download p-2 rounded-lg'), 'Minimal download icon button present');
assert(!galleryCode.includes('<span class="hidden sm:inline">Regenerate</span>'), 'Regenerate text pill removed from result header');
assert(!galleryCode.includes('btn-group-reuse'), 'Pencil/edit icon button removed from header');
assert(!galleryCode.includes('btn-group-copy'), 'Copy prompt icon button removed from header');
assert(!galleryCode.includes('btn-group-delete'), 'Trash/delete icon button removed from header');
assert(galleryCode.includes('group-prompt-title'), 'Prompt title element preserved');
assert(galleryCode.includes('modelObj.name'), 'Model metadata preserved');
assert(galleryCode.includes('group.aspectRatio'), 'Aspect ratio metadata preserved');
assert(galleryCode.includes('variationCount'), 'Variation count metadata preserved');

console.log('✔ All result header button requirements verified 100% in galleryCode!');
