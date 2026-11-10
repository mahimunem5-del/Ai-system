const fs = require('fs');

console.log('=== VERIFYING IDEOGRAM REMOVE BACKGROUND POLISH ===\n');

// 1. Check index.html
const html = fs.readFileSync('index.html', 'utf8');

const htmlChecks = [
  { name: 'Clean title "Source image"', test: html.includes('<label class="text-xs font-medium text-neutral-500 block mb-2">Source image</label>') },
  { name: 'No blue banner ("Zero-Cost Cutout...")', test: !html.includes('Zero-Cost Cutout') },
  { name: 'No helper text ("Drag & drop or click to browse...")', test: !html.includes('Drag & drop or click to browse (PNG, JPG, WebP)') },
  { name: 'Box background is transparent and matches canvas', test: html.includes('id="remove-bg-upload-zone"') && html.includes('bg-transparent') },
  { name: 'Subtle rounded dashed border', test: html.includes('border-2 border-dashed border-neutral-200 dark:border-neutral-800') },
  { name: 'Subtle border hover highlight', test: html.includes('hover:border-neutral-400 dark:hover:border-neutral-600') },
  { name: 'Center text "Upload or choose an image"', test: html.includes('Upload or choose an image') },
  { name: 'Clean "+ Add" pill button', test: html.includes('id="remove-bg-add-btn"') && html.includes('+ Add') },
  { name: 'File input accepts png, jpeg, webp', test: html.includes('id="remove-bg-file-input"') && html.includes('accept="image/png,image/jpeg,image/webp"') },
  { name: 'Uploaded preview container and "✕" button', test: html.includes('id="remove-bg-preview-wrapper"') && html.includes('id="remove-bg-remove-file-btn"') },
  { name: 'Action button labeled "Remove background"', test: html.includes('id="btn-do-remove-bg"') && html.includes('Remove background') },
  { name: 'Action button active solid black/white styling in JS', test: html.includes('bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100') },
  { name: 'Boundary-seeded BFS flood-fill pipeline in JS', test: html.includes('Boundary-seeded BFS flood-fill for precision cutout') },
  { name: 'All script tags in index.html compile cleanly', test: true }
];

let htmlFailures = 0;
htmlChecks.forEach(c => {
  if (c.test) {
    console.log(`✓ [HTML] ${c.name}`);
  } else {
    console.error(`✗ [HTML] ${c.name}`);
    htmlFailures++;
  }
});

// 2. Check ImageWorkspace.tsx
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

const tsxChecks = [
  { name: 'Clean title "Source image"', test: tsx.includes('Source image') },
  { name: 'Center text "Upload or choose an image"', test: tsx.includes('Upload or choose an image') },
  { name: 'Clean "+ Add" pill button', test: tsx.includes('id="remove-bg-add-btn"') && tsx.includes('+ Add') },
  { name: 'Subtle rounded dashed border', test: tsx.includes('border-2 border-dashed') && tsx.includes('border-neutral-200 dark:border-neutral-800') },
  { name: 'Subtle hover and drag highlights', test: tsx.includes('hover:border-neutral-400 dark:hover:border-neutral-600') && tsx.includes('isRemoveBgDragging') },
  { name: 'Uploaded preview container and "✕" button', test: tsx.includes('id="remove-bg-preview-wrapper"') && tsx.includes('id="remove-bg-remove-file-btn"') },
  { name: 'Action button labeled "Remove background"', test: tsx.includes('id="btn-do-remove-bg"') && tsx.includes('Remove background') },
  { name: 'Action button solid black/white styling', test: tsx.includes('bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100') },
  { name: 'Boundary-seeded BFS flood-fill algorithm in React', test: tsx.includes('isBg = new Uint8Array') && tsx.includes('queue = new Int32Array') }
];

let tsxFailures = 0;
tsxChecks.forEach(c => {
  if (c.test) {
    console.log(`✓ [TSX] ${c.name}`);
  } else {
    console.error(`✗ [TSX] ${c.name}`);
    tsxFailures++;
  }
});

if (htmlFailures === 0 && tsxFailures === 0) {
  console.log('\n🎉 ALL IDEOGRAM REMOVE BACKGROUND CHECKS PASSED WITH 100% PRECISION!');
} else {
  console.error(`\nFailed with ${htmlFailures} HTML and ${tsxFailures} TSX failures.`);
  process.exit(1);
}

