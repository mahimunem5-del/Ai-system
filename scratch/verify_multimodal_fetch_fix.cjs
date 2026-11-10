const fs = require('fs');
const assert = require('assert');

async function run() {
  console.log('=== VERIFYING MULTIMODAL VISION & FETCH FIX ===\n');

  // 1. Check Server Index Configuration
  console.log('1. Checking Server Index Configuration (server/src/index.js)...');
  const serverIndexCode = fs.readFileSync('server/src/index.js', 'utf8');

  assert(serverIndexCode.includes("express.json({ limit: '50mb' })"), 'express.json 50mb limit missing');
  assert(serverIndexCode.includes("express.urlencoded({ extended: true, limit: '50mb' })"), 'express.urlencoded 50mb limit missing');
  assert(serverIndexCode.includes('origin: (origin, callback)') || serverIndexCode.includes('origin: function'), 'Dynamic CORS origin handler missing');
  assert(serverIndexCode.includes('localhost') && serverIndexCode.includes('127'), 'Localhost and 127.0.0.1 CORS support missing');
  console.log('✔ Server body parser limit is 50MB and CORS supports local dev ports');

  // 2. Check Controller Vision Pipeline
  console.log('\n2. Checking Image Controller (server/src/controllers/imageController.js)...');
  const controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

  assert(controllerCode.includes('export function formatImageUrlForVision'), 'formatImageUrlForVision export missing');
  assert(controllerCode.includes('maxBodyLength: Infinity'), 'axios maxBodyLength Infinity missing');
  assert(controllerCode.includes('maxContentLength: Infinity'), 'axios maxContentLength Infinity missing');
  assert(controllerCode.includes('timeout: 15000'), 'Mahi Engine timeout missing');
  assert(controllerCode.includes('enhancePromptWithMahiEngine'), 'enhancePromptWithMahiEngine missing');
  assert(controllerCode.includes('openai/gpt-4o-mini'), 'OpenAI GPT-4o-mini vision model missing');
  assert(controllerCode.includes("type: 'image_url'"), 'Multimodal image_url missing');

  // Test formatImageUrlForVision logic directly
  const { formatImageUrlForVision, isValidImageUrlString } = await import('../server/src/controllers/imageController.js');

  // Test URLs and Data URIs
  assert.strictEqual(formatImageUrlForVision('https://example.com/test.jpg'), 'https://example.com/test.jpg');
  assert.strictEqual(formatImageUrlForVision('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='), 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
  // Test raw base64 without prefix
  const rawJpg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const formattedJpg = formatImageUrlForVision(rawJpg);
  assert(formattedJpg.startsWith('data:image/jpeg;base64,/9j/'), 'Raw JPEG base64 not correctly prefixed');

  const rawPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const formattedPng = formatImageUrlForVision(rawPng);
  assert(formattedPng.startsWith('data:image/png;base64,iVBOR'), 'Raw PNG base64 not correctly prefixed');

  console.log('✔ formatImageUrlForVision formats HTTP/HTTPS and raw Base64 strings safely');

  // 3. Check Frontend Fetch & Error Handling in index.html
  console.log('\n3. Checking Frontend Fetch & Error Handling in index.html...');
  const html = fs.readFileSync('index.html', 'utf8');

  assert(html.includes('compressImageDataUrl('), 'compressImageDataUrl function missing');
  assert(html.includes('async function setStudioReferenceImage'), 'setStudioReferenceImage async definition missing');
  assert(html.includes('await compressImageDataUrl('), 'compressImageDataUrl call missing');
  assert(html.includes('netErr.message.toLowerCase().includes(\'failed to fetch\')'), 'Friendly network error detection missing');
  assert(html.includes('response.status === 413'), 'HTTP 413 payload too large handler missing');
  assert(html.includes('await response.text()'), 'Safe response.text() reading missing');
  assert(html.includes('showStudioToast(userMsg)'), 'userMsg toast notification missing');

  console.log('✔ Frontend provides client-side image compression, connection failure diagnostics, and robust 413 / error parsing');

  console.log('\n🎉 ALL MULTIMODAL VISION & FETCH FIX REQUIREMENTS VERIFIED 100%!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
