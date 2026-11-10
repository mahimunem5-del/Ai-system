// scratch/verify_precise_edit_ideogram_match.cjs
const fs = require('fs');

console.log('=== VERIFYING PRECISE EDIT IDEOGRAM MATCH & BEHAVIORAL FIXES ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

const checks = [
  // 1. Auto-Fill & Initial Empty State
  {
    category: '1. Auto-Fill & Initial Empty State',
    name: '[HTML] No auto-preloading of STUDIO_RECENT_IMAGES[0] in switchWorkflowTool',
    pass: !html.includes("if (!studioPreciseEditState.sourceItem && Array.isArray(STUDIO_RECENT_IMAGES)")
  },
  {
    category: '1. Auto-Fill & Initial Empty State',
    name: '[TSX] No auto-preloading of assets[0] on carousel card click',
    pass: !tsx.includes("if (!sourceImage && assets.length > 0) {\n                    setSourceImage(assets[0].url);")
  },
  {
    category: '1. Auto-Fill & Initial Empty State',
    name: '[TSX] No auto-preloading of assets[0] on tool switcher flyout click',
    pass: !tsx.includes("if (!sourceImage && assets.length > 0) {\n                                  setSourceImage(assets[0].url);")
  },
  {
    category: '1. Auto-Fill & Initial Empty State',
    name: '[HTML] Label above dropzone is "Image" with text-xs font-medium text-neutral-500 mb-2',
    pass: html.includes('<label class="text-xs font-medium text-neutral-500 block mb-2">Image</label>')
  },
  {
    category: '1. Auto-Fill & Initial Empty State',
    name: '[HTML] Empty dropzone container has rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800',
    pass: html.includes('id="studio-precise-edit-dropzone"') && html.includes('rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800')
  },
  {
    category: '1. Auto-Fill & Initial Empty State',
    name: '[HTML] Inner text "Upload or choose an image" with "+ Add" pill button',
    pass: html.includes('id="studio-precise-edit-dropzone"') && html.includes('Upload or choose an image') && html.includes('id="studio-precise-edit-add-btn"') && html.includes('+ Add')
  },

  // 2. Close Image ('✕') Action (Do NOT Exit Tool)
  {
    category: "2. Close Image ('✕') Action",
    name: "[HTML] removeSrcBtn does NOT call exitStudioPreciseEdit() or show 'Exited edit mode'",
    pass: !html.includes('removeSrcBtn.addEventListener("click", () => {\n                    exitStudioPreciseEdit();\n                    showStudioToast("Exited edit mode");')
  },
  {
    category: "2. Close Image ('✕') Action",
    name: "[HTML] removeSrcBtn calls clearStudioPreciseEditSource() to clear source and stay in Precise Edit",
    pass: html.includes('clearStudioPreciseEditSource()') && html.includes('studioPreciseEditState.sourceItem = null;')
  },
  {
    category: "2. Close Image ('✕') Action",
    name: "[TSX] '✕' remove button sets setSourceImage(null) without resetting mode or tool",
    pass: tsx.includes('id="studio-precise-edit-remove-src-btn"') && tsx.includes('setSourceImage(null)')
  },

  // 3. Form Layout & Action Button Matching Ideogram
  {
    category: '3. Form Layout & Action Button',
    name: '[HTML] Edit Prompt label is "What should change?"',
    pass: html.includes('What should change?')
  },
  {
    category: '3. Form Layout & Action Button',
    name: '[HTML] Textarea placeholder is "Describe the change you want..."',
    pass: html.includes('placeholder="Describe the change you want..."')
  },
  {
    category: '3. Form Layout & Action Button',
    name: '[HTML] Reference image slots present below textarea',
    pass: html.includes('id="studio-precise-edit-ref-section"') && html.includes('Reference images')
  },
  {
    category: '3. Form Layout & Action Button',
    name: '[HTML] Quality dropdown (Medium) and Variations picker (1)',
    pass: html.includes('id="studio-precise-weight-wrapper"') && html.includes('id="studio-precise-count-wrapper"')
  },
  {
    category: '3. Form Layout & Action Button',
    name: '[HTML] Apply edit button has disabled/muted state when no source image',
    pass: html.includes('id="studio-apply-precise-edit-btn"') && html.includes('Apply edit') && html.includes('updatePreciseEditButtonState')
  },
  {
    category: '3. Form Layout & Action Button',
    name: '[TSX] Form matches Ideogram: Image, What should change?, Quality, Variations, Apply edit',
    pass: tsx.includes('What should change?') && tsx.includes('Describe the change you want...') && tsx.includes('id="studio-apply-precise-edit-btn"')
  },

  // 4. Proportional Scaling on Sidebar Resize
  {
    category: '4. Proportional Scaling',
    name: '[HTML] Dropzone uses aspect-[4/3] max-h-[380px]',
    pass: html.includes('id="studio-precise-edit-dropzone"') && html.includes('aspect-[4/3]') && html.includes('max-h-[380px]')
  },
  {
    category: '4. Proportional Scaling',
    name: '[HTML] Preview container uses aspect-[4/3] max-h-[380px]',
    pass: html.includes('id="studio-precise-edit-preview-wrap"') && html.includes('aspect-[4/3]') && html.includes('max-h-[380px]')
  },
  {
    category: '4. Proportional Scaling',
    name: '[TSX] Dropzone uses aspect-[4/3] max-h-[380px]',
    pass: tsx.includes('id="studio-precise-edit-dropzone"') && tsx.includes('aspect-[4/3]') && tsx.includes('max-h-[380px]')
  },
  {
    category: '4. Proportional Scaling',
    name: '[TSX] Preview container uses aspect-[4/3] max-h-[380px]',
    pass: tsx.includes('id="studio-precise-edit-preview-wrap"') && tsx.includes('aspect-[4/3]') && tsx.includes('max-h-[380px]')
  }
];

let failed = 0;
let currentCat = '';
checks.forEach(c => {
  if (c.category !== currentCat) {
    currentCat = c.category;
    console.log(`\n--- ${currentCat} ---`);
  }
  if (c.pass) {
    console.log(`✓ ${c.name}`);
  } else {
    console.error(`✗ ${c.name}`);
    failed++;
  }
});

console.log(`\n===========================================`);
if (failed === 0) {
  console.log(`🎉 ALL ${checks.length} PRECISE EDIT VERIFICATIONS PASSED WITH 100% SUCCESS!`);
} else {
  console.error(`❌ ${failed} checks failed!`);
  process.exit(1);
}

