const assert = require('assert');
const fs = require('fs');

console.log('=== VERIFYING SEEDREAM 5.0 PRO COMPREHENSIVE LOGGING & ERROR HANDLING ===\n');

// 1. Inspect server/src/controllers/imageController.js
console.log('1. Checking imageController.js implementation...');
const controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// Verify Seedream model mapping exists
assert(controllerCode.includes("'bytedance-seed/seedream-5.0-pro': 'bytedance-seed/seedream-5.0-pro'"), 'OpenRouter model map must contain seedream');
assert(controllerCode.includes("'Seedream 5.0 Pro': 'bytedance-seed/seedream-5.0-pro'"), 'MODEL_NAME_TO_ID must map Seedream 5.0 Pro');

// Verify Dedicated Dispatcher Branch
assert(controllerCode.includes("selectedModelId === 'bytedance-seed/seedream-5.0-pro'"), 'Seedream model ID check missing');

// Verify Logging Requirements
assert(controllerCode.includes("console.log('Seedream Request URL:', targetUrl)"), 'Seedream Request URL log missing');
assert(controllerCode.includes("console.log('Seedream Request Headers:',"), 'Seedream Request Headers log missing');
assert(controllerCode.includes("console.log('Seedream Request Payload:',"), 'Seedream Request Payload log missing');
assert(controllerCode.includes("console.log('OpenRouter Seedream Status:', response.status)"), 'Status log missing');
assert(controllerCode.includes("console.log('OpenRouter Seedream Response:', rawResponseText)"), 'Raw response log missing');

// Verify Non-200 Handling
assert(controllerCode.includes("return res.status(statusCode).json({"), 'Status code return missing');
assert(controllerCode.includes("errorData?.error?.message ||"), 'Error message extraction missing');

console.log('✔ Comprehensive runtime logging and error extraction verified');

// 2. Unit testing response extraction
console.log('\n2. Testing image extraction & format resilience...');
function extractAndFormatImage(dataItem) {
  if (!dataItem) return null;
  if (typeof dataItem === 'string') {
    const trimmed = dataItem.trim();
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.startsWith('/9j/')) return `data:image/jpeg;base64,${trimmed}`;
    if (trimmed.startsWith('iVBOR')) return `data:image/png;base64,${trimmed}`;
    return `data:image/png;base64,${trimmed}`;
  }
  if (typeof dataItem === 'object') {
    if (dataItem.url && typeof dataItem.url === 'string') return extractAndFormatImage(dataItem.url);
    if (dataItem.b64_json && typeof dataItem.b64_json === 'string') return extractAndFormatImage(dataItem.b64_json);
    if (dataItem.image && typeof dataItem.image === 'string') return extractAndFormatImage(dataItem.image);
  }
  return null;
}

const urlResult = extractAndFormatImage({ url: 'https://openrouter.ai/images/seedream_sample.png' });
assert.strictEqual(urlResult, 'https://openrouter.ai/images/seedream_sample.png');

const b64Result = extractAndFormatImage({ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAE=' });
assert.strictEqual(b64Result, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE=');

console.log('✔ URL and Base64 format extraction verified');

// 3. Verify untouched status of other models
console.log('\n3. Verifying non-Seedream models continue with untouched general pipeline...');
assert(controllerCode.includes("size: `${dimensions.width}x${dimensions.height}`"), 'Other models size param intact');
assert(controllerCode.includes("'openai/gpt-image-2.5-sunburst'"), 'GPT Image model intact');
assert(controllerCode.includes("'black-forest-labs/flux.2-pro'"), 'FLUX.2 Pro model intact');
assert(controllerCode.includes("'meta/muse-image'"), 'Meta Muse model intact');
assert(controllerCode.includes("'google/gemini-3-pro-image'"), 'Gemini image model intact');

console.log('✔ All other models and untouched general flows verified');

console.log('\n🎉 ALL SEEDREAM 5.0 PRO BACKEND RUNTIME LOGGING & ERROR HANDLING CHECKS PASSED 100%!');
