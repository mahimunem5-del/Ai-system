import assert from 'assert';
import {
  OPENROUTER_IMAGE_MODEL_MAP,
  MODEL_NAME_TO_ID,
  resolveOpenRouterImageModel,
  resolveDimensions,
  extractAndFormatImage
} from '../src/controllers/imageController.js';

console.log('--- Testing Image Workspace OpenRouter Integration ---');

// 1. Model ID Mapping
assert.strictEqual(
  resolveOpenRouterImageModel('openai/gpt-image-2.5-sunburst'),
  'openai/gpt-image-2.5-sunburst'
);
assert.strictEqual(
  resolveOpenRouterImageModel('google/gemini-3-pro-image'),
  'google/gemini-3-pro-image'
);
assert.strictEqual(
  resolveOpenRouterImageModel('google/nano-banana-pro'),
  'google/gemini-3-pro-image'
);
assert.strictEqual(
  resolveOpenRouterImageModel('black-forest-labs/flux.2-pro'),
  'black-forest-labs/flux.2-pro'
);
assert.strictEqual(
  resolveOpenRouterImageModel('bytedance-seed/seedream-5.0-pro'),
  'bytedance-seed/seedream-5.0-pro'
);
assert.strictEqual(
  resolveOpenRouterImageModel('meta/muse-image'),
  'meta/muse-image'
);
assert.strictEqual(
  resolveOpenRouterImageModel('google/gemini-3.1-flash-image-preview'),
  'google/gemini-3.1-flash-image-preview'
);
assert.strictEqual(
  resolveOpenRouterImageModel('google/nano-banana-2'),
  'google/gemini-3.1-flash-image-preview'
);
console.log('✓ Model ID mapping passed');

// 2. Display Name Mapping
assert.strictEqual(
  resolveOpenRouterImageModel('GPT Image 2.5 Sunburst'),
  'openai/gpt-image-2.5-sunburst'
);
assert.strictEqual(
  resolveOpenRouterImageModel('Nano Banana Pro (Gemini 3 Pro Image)'),
  'google/gemini-3-pro-image'
);
assert.strictEqual(
  resolveOpenRouterImageModel('FLUX.2 Pro'),
  'black-forest-labs/flux.2-pro'
);
assert.strictEqual(
  resolveOpenRouterImageModel('Seedream 5.0 Pro'),
  'bytedance-seed/seedream-5.0-pro'
);
assert.strictEqual(
  resolveOpenRouterImageModel('Meta: Muse Image'),
  'meta/muse-image'
);
assert.strictEqual(
  resolveOpenRouterImageModel('Nano Banana 2 (Gemini 3.1 Flash Image)'),
  'google/gemini-3.1-flash-image-preview'
);
console.log('✓ Display Name resolution passed');

// 3. Aspect Ratio Dimensions
const r1 = resolveDimensions('1:1');
assert.strictEqual(r1.width, 1024);
assert.strictEqual(r1.height, 1024);

const r169 = resolveDimensions('16:9');
assert.strictEqual(r169.width, 1344);
assert.strictEqual(r169.height, 768);

const r916 = resolveDimensions('9:16');
assert.strictEqual(r916.width, 768);
assert.strictEqual(r916.height, 1344);

const r43 = resolveDimensions('4:3');
assert.strictEqual(r43.width, 1152);
assert.strictEqual(r43.height, 864);
console.log('✓ Aspect ratio dimension resolution passed');

// 4. Image Extraction & Formatting
// 4a. Direct URL
assert.strictEqual(
  extractAndFormatImage('https://example.com/test.jpg'),
  'https://example.com/test.jpg'
);
// 4b. Data URI
assert.strictEqual(
  extractAndFormatImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE='),
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE='
);
// 4c. Object with b64_json (JPEG)
assert.strictEqual(
  extractAndFormatImage({ b64_json: '/9j/4AAQSkZJRgABAQ...' }),
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
);
// 4d. Object with b64_json (PNG)
assert.strictEqual(
  extractAndFormatImage({ b64_json: 'iVBORw0KGgoAAAANSUhEUgAA...' }),
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
);
// 4e. Object with url
assert.strictEqual(
  extractAndFormatImage({ url: 'https://images.openrouter.ai/123.jpg' }),
  'https://images.openrouter.ai/123.jpg'
);
console.log('✓ Image extraction and formatting passed');

console.log('\nAll Image Workspace unit tests passed successfully!');
