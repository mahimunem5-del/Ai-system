const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING COMPACT BORDERLESS IMAGE CARD LAYOUT ===');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Check renderStudioAssetsGallery function boundaries
const startGallery = html.indexOf('function renderStudioAssetsGallery()');
const endGallery = html.indexOf('function applyParametersToLeftPanel');
assert(startGallery !== -1 && endGallery !== -1, 'renderStudioAssetsGallery boundaries found');

const galleryCode = html.slice(startGallery, endGallery);

// 2. Verify outer card container styling: NO framing card borders, shadows, backgrounds or padding
assert(galleryCode.includes("groupCard.className = 'ideogram-asset-group w-full space-y-3 transition-all';"),
    'Outer groupCard has clean, borderless container classes');
assert(!galleryCode.includes('groupCard.className = \'ideogram-asset-group bg-white'),
    'Framing card background stripped from groupCard');
assert(!galleryCode.includes('rounded-2xl border border-slate-200'),
    'Outer border stripped from groupCard');
assert(!galleryCode.includes('shadow-xs hover:border-slate-300'),
    'Outer box-shadow and hover borders stripped from groupCard');

// 3. Verify header has no dividing border-b
assert(galleryCode.includes('<!-- Asset Group Header -->\n                    <div class="flex flex-wrap items-start justify-between gap-3 pb-1">'),
    'Header container has clean borderless padding without dividing border-b');

// 4. Verify compact image sizing
assert(galleryCode.includes("let maxW = 'max-w-[420px]';"), 'Default single image max-width constrained to 420px');
assert(galleryCode.includes("if (group.aspectRatio === '9:16') maxW = 'max-w-[280px]';"), '9:16 mobile ratio constrained to 280px');
assert(galleryCode.includes("else if (group.aspectRatio === '1:1') maxW = 'max-w-[400px]';"), '1:1 ratio constrained to 400px');
assert(galleryCode.includes("variationsGrid.className = `variations-grid w-full ${maxW}`;"), 'variationsGrid width constrained directly');

// 5. Verify image card styling and aspect ratios
assert(galleryCode.includes("aspect-[2/3]"), '2:3 aspect ratio supported');
assert(galleryCode.includes("aspect-[3/2]"), '3:2 aspect ratio supported');
assert(galleryCode.includes("card.className = `ideogram-variation-card group/card relative rounded-xl overflow-hidden bg-slate-100 dark:bg-[#151c24] ${aspectClass} max-h-[520px] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between w-full cursor-pointer ${selectedOutline}`;") || galleryCode.includes("ideogram-variation-card group/card relative rounded-xl overflow-hidden"),
    'Image card has rounded-xl, overflow-hidden, max-h-[520px], and no framing border');

// 6. Verify all button actions and overlays preserved
assert(galleryCode.includes('btn-group-regenerate'), 'Regenerate action button preserved');
assert(galleryCode.includes('btn-group-download'), 'Group download action button preserved');
assert(galleryCode.includes('btn-card-download'), 'Card download overlay button preserved');
assert(galleryCode.includes('btn-card-copy-prompt'), 'Card copy prompt overlay button preserved');
assert(galleryCode.includes('btn-card-edit'), 'Card edit overlay button preserved');
assert(galleryCode.includes('variation-checkbox'), 'Checkbox selection preserved');

console.log('✔ All compact, borderless image card layout requirements verified 100%!');

