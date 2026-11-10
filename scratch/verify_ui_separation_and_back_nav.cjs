const assert = require('assert');
const fs = require('fs');

console.log('=== VERIFYING UNIFIED PRECISE EDIT PIPELINE & NAVIGATION ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

// 1. Tool Unification in WORKFLOW_TOOLS
console.log('--- 1. WORKFLOW_TOOLS Unification ---');
assert(html.includes("id: 'precise-edit'"), 'WORKFLOW_TOOLS must contain precise-edit');
assert(html.includes("if (toolId === 'smart-edit') toolId = 'precise-edit';"), 'Must alias/unify any legacy smart-edit call directly to precise-edit');
console.log('  ✓ Precise Edit is unified in WORKFLOW_TOOLS with smart-edit mapped to precise-edit');

// 2. Creative Workflows Carousel Card Click
console.log('\n--- 2. Creative Workflows Carousel Card Click ---');
assert(html.includes('data-workflow-tool="precise-edit"'), 'Card 3 must target precise-edit');
assert(html.includes("if (toolId === 'precise-edit') {\n                            studioPreciseEditState.sourceItem = null;"), 'Precise edit card click clears sourceItem for clean dropzone');
console.log('  ✓ Precise Edit card click resets sourceItem to ensure clean dropzone');

// 3. Header Titles Parity
console.log('\n--- 3. Header Title Unified Display ---');
assert(html.includes('id="ideogram-header-edit-title"'), 'Header edit title element exists');
assert(html.includes("if (editTitle) editTitle.textContent = 'Precise Edit';"), 'Sets Precise Edit header title');
console.log('  ✓ Top header strictly displays "Precise Edit"');

// 4. Back Button Navigation
console.log('\n--- 4. Back Button Navigation ---');
assert(!html.includes("switchWorkflowTool('generate-image');"), 'exitStudioPreciseEdit must NOT switch to generate-image');
assert(html.includes("setImageStudioMode('home');"), 'exitStudioPreciseEdit navigates to home');
assert(html.includes("backToHomeBtn.addEventListener('click'"), 'backToHomeBtn has click listener');
assert(html.includes("editBackBtn.addEventListener('click'"), 'editBackBtn has click listener');
console.log('  ✓ Back button navigates cleanly to Images Home view without switching to Generate Image');

// 5. Template and Image Action Menu directly trigger Precise Edit
console.log('\n--- 5. Direct Precise Edit Triggers ---');
assert(html.includes("setImageStudioMode('workspace', { editItem: item, tool: 'precise-edit' });"), 'btn-home-card-edit passes tool: precise-edit');
assert(html.includes("setImageStudioMode('workspace', { editItem, tool: 'precise-edit' });"), 'btn-tmpl-card-edit passes tool: precise-edit');
assert(html.includes("enterStudioPreciseEdit(selectedItem);"), 'floatingEditBtn triggers enterStudioPreciseEdit');
console.log('  ✓ Templates and Action Menus cleanly trigger Precise Edit');

// 6. React Parity in ImageWorkspace.tsx
console.log('\n--- 6. React Parity (ImageWorkspace.tsx) ---');
assert(tsx.includes("{ id: 'precise-edit', label: 'Precise Edit'"), 'TSX WORKFLOW_TOOLS_CONFIG contains precise-edit');
assert(!tsx.includes("{ id: 'smart-edit', label: 'Smart Edit'"), 'TSX WORKFLOW_TOOLS_CONFIG removes deprecated smart-edit');
assert(tsx.includes("setWorkflowTool('precise-edit');\n                  setMode('edit');\n                  setSourceImage(null);"), 'TSX Precise Edit card click sets clean dropzone');
assert(tsx.includes("onClick={() => {\n                setView('home');\n                setSourceImage(null);"), 'TSX Back button cleanly navigates to home');
console.log('  ✓ ImageWorkspace.tsx has matching unified Precise Edit configuration and back navigation');

console.log('\n===========================================');
console.log('🎉 ALL 6 UNIFIED PRECISE EDIT VERIFICATIONS PASSED (100%)!');
console.log('===========================================');
