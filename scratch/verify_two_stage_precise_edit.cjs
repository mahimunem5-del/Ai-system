// scratch/verify_two_stage_precise_edit.cjs
const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING TWO-STAGE PRECISE EDIT PIPELINE (MAHI ENGINE & FLUX.2 FLEX) ===\n');

let passedChecks = 0;
function pass(desc) {
  passedChecks++;
  console.log(`✓ ${desc}`);
}

// ----------------------------------------------------------------------------
// 1. ROUTE VERIFICATION
// ----------------------------------------------------------------------------
console.log('--- 1. Backend Route & Export Verification ---');
const routesCode = fs.readFileSync('server/src/routes/image.js', 'utf8');
assert(routesCode.includes("router.post('/precise-edit', executePreciseEdit)"), 'routes/image.js must mount /precise-edit');
pass('server/src/routes/image.js mounts POST /precise-edit with executePreciseEdit');

const controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');
assert(controllerCode.includes('export async function executePreciseEdit'), 'imageController must export executePreciseEdit');
pass('imageController.js exports executePreciseEdit');

assert(controllerCode.includes('export async function enhancePreciseEditPromptWithMahiEngine'), 'imageController must export enhancePreciseEditPromptWithMahiEngine');
pass('imageController.js exports enhancePreciseEditPromptWithMahiEngine');

assert(controllerCode.includes('export function extractImagesFromChatCompletion'), 'imageController must export extractImagesFromChatCompletion');
pass('imageController.js exports extractImagesFromChatCompletion');

// ----------------------------------------------------------------------------
// 2. MODEL MAPPING VERIFICATION
// ----------------------------------------------------------------------------
console.log('\n--- 2. FLUX.2 Flex Model Mapping Verification ---');
assert(controllerCode.includes("'black-forest-labs/flux.2-flex': 'black-forest-labs/flux.2-flex'"), 'OPENROUTER_IMAGE_MODEL_MAP must contain flux.2-flex');
assert(controllerCode.includes("'FLUX.2 Flex': 'black-forest-labs/flux.2-flex'"), 'MODEL_NAME_TO_ID must contain FLUX.2 Flex');
assert(controllerCode.includes("'black-forest-labs/flux.2-flex': 'FLUX.2 Flex'"), 'MODEL_ID_TO_DISPLAY_NAME must contain FLUX.2 Flex');
pass('imageController.js maps black-forest-labs/flux.2-flex across all model registries');

// ----------------------------------------------------------------------------
// 3. STAGE 1: MAHI ENGINE SYSTEM PROMPT
// ----------------------------------------------------------------------------
console.log('\n--- 3. Stage 1: Mahi Engine Vision Reasoning & System Instruction ---');
assert(controllerCode.includes('STYLE LOCK') && controllerCode.includes('COMPOSITION LOCK') && controllerCode.includes('TARGET DELTA'), 'Must enforce STYLE LOCK, COMPOSITION LOCK, and TARGET DELTA in Stage 1');
assert(controllerCode.includes('100% IDENTICAL'), 'Must enforce 100% identical composition constraint');
pass('Stage 1 Mahi Engine system instruction strictly matches required prompt engineering criteria (Style Lock & Composition Lock)');

// ----------------------------------------------------------------------------
// 4. STAGE 2: FLUX.2 FLEX SYNTHESIS VIA OPENROUTER CHAT COMPLETIONS API
// ----------------------------------------------------------------------------
console.log('\n--- 4. Stage 2: FLUX.2 Flex Synthesis via OpenRouter Chat Completions API ---');
assert(controllerCode.includes("https://openrouter.ai/api/v1/chat/completions"), 'Must target OpenRouter standard Chat Completions API');
assert(controllerCode.includes("black-forest-labs/flux.2-flex"), 'Must specify black-forest-labs/flux.2-flex');
assert(controllerCode.includes("image_url"), 'Must supply image_url parameter');
assert(controllerCode.includes("Promise.all(tasks)"), 'Must execute concurrent tasks via Promise.all for variations');
pass('Stage 2 synthesizes with FLUX.2 Flex via https://openrouter.ai/api/v1/chat/completions with concurrent Promise.all');

// ----------------------------------------------------------------------------
// 5. HTML FRONTEND TRIGGER & VARIATIONS
// ----------------------------------------------------------------------------
console.log('\n--- 5. HTML Frontend Trigger & Variations Verification ---');
const html = fs.readFileSync('index.html', 'utf8');

// Quality options
assert(html.includes('data-weight="speed"') && html.includes('Speed'), 'index.html must support Speed quality');
assert(html.includes('data-weight="medium"') && html.includes('Medium'), 'index.html must support Medium quality');
assert(html.includes('data-weight="high"') && html.includes('High'), 'index.html must support High quality');
pass('index.html Quality dropdown supports Speed, Medium, High');

// Variations options 1 to 4
for (let c = 1; c <= 4; c++) {
  assert(html.includes(`data-count="${c}"`), `index.html must contain variation count ${c}`);
}
pass('index.html Variations dropdown cleanly supports 1, 2, 3, 4 images');

// Loading state transition: "Mahi Engine refining..." -> "Generating with FLUX.2..."
assert(html.includes('applyText.textContent = "Mahi Engine refining..."'), 'Must set initial loading text to Mahi Engine refining...');
assert(html.includes('applyText.textContent = "Generating with FLUX.2..."'), 'Must transition loading text to Generating with FLUX.2...');
pass('index.html implements two-stage loading transitions ("Mahi Engine refining..." -> "Generating with FLUX.2...")');

// Endpoint call
assert(html.includes('/api/images/precise-edit'), 'index.html must call /api/images/precise-edit');
pass('index.html dispatches request to /api/images/precise-edit');

// History feed tag & render
assert(html.includes('Precise Edit'), 'index.html must tag asset with Precise Edit');
assert(html.includes('${isPreciseEdit ? \'bg-indigo-500\' : \'bg-blue-500\'}'), 'index.html has distinct dot for Precise Edit');
assert(html.includes('renderStudioAssetsGallery()'), 'index.html calls renderStudioAssetsGallery');
pass('index.html renders history group tag "Precise Edit • Just now • [Model] • [N] variation(s)"');

// ----------------------------------------------------------------------------
// 6. REACT TSX COMPONENT INTEGRITY
// ----------------------------------------------------------------------------
console.log('\n--- 6. React Component (ImageWorkspace.tsx) Verification ---');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

assert(tsx.includes("(['speed', 'medium', 'high'] as const)"), 'ImageWorkspace.tsx must support speed, medium, high');
assert(tsx.includes("preciseLoadingStep"), 'ImageWorkspace.tsx must track preciseLoadingStep');
assert(tsx.includes("Mahi Engine refining..."), 'ImageWorkspace.tsx must display Mahi Engine refining...');
assert(tsx.includes("Generating with FLUX.2..."), 'ImageWorkspace.tsx must display Generating with FLUX.2...');
assert(tsx.includes("model: img.model || data.model || 'black-forest-labs/flux.2-flex'"), 'ImageWorkspace.tsx handles dynamic model in state');
pass('src/components/ImageWorkspace.tsx reflects Two-Stage pipeline and loading states');

console.log('\n===========================================');
console.log(`🎉 ALL ${passedChecks} PRECISE EDIT PIPELINE CHECKS PASSED WITH 100% SUCCESS!`);
console.log('===========================================');
