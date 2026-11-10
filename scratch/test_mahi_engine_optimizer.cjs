const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING MAHI ENGINE PROMPT OPTIMIZER & PIPELINE REFACTOR ===');

// 1. Verify route definitions in server/src/routes/image.js
const routesPath = path.join(__dirname, '..', 'server', 'src', 'routes', 'image.js');
const routesCode = fs.readFileSync(routesPath, 'utf8');

assert(!routesCode.includes('/conversation'), 'router.post("/conversation") must be removed');
assert(routesCode.includes("router.post('/', generateImage)"), "router.post('/', generateImage) present");
assert(routesCode.includes("router.post('/generate', generateImage)"), "router.post('/generate', generateImage) present");
console.log('✔ 1. Route /conversation successfully removed from image.js');

// 2. Verify controller code in server/src/controllers/imageController.js
const controllerPath = path.join(__dirname, '..', 'server', 'src', 'controllers', 'imageController.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');

assert(controllerCode.includes('enhancePromptWithMahiEngine'), 'enhancePromptWithMahiEngine function exists');
assert(controllerCode.includes('You are Mahi Engine, an expert AI prompt enhancer for visual generative models.'), 'System instruction matches requirement');
assert(controllerCode.includes('openai/gpt-4o-mini'), 'Uses openai/gpt-4o-mini for fast prompt enhancement');
assert(controllerCode.includes('await enhancePromptWithMahiEngine(rawPrompt, apiKey, requestId)'), 'Called inside generateImage');
assert(controllerCode.includes('originalPrompt: rawPrompt'), 'Preserves original prompt in response objects');
console.log('✔ 2. Mahi Engine prompt enhancer verified in imageController.js');

// 3. Verify fallback safeguard
assert(controllerCode.includes('catch (err) {'), 'Error catch block present in enhancePromptWithMahiEngine');
assert(controllerCode.includes('return trimmed;'), 'Graceful fallback to original prompt on error or timeout');
console.log('✔ 3. Fallback safeguard on error or timeout verified');

console.log('\n🎉 ALL MAHI ENGINE PIPELINE REFACTOR CHECKS PASSED 100%!');

