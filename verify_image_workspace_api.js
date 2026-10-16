import assert from 'assert';
import fs from 'fs';

console.log('--- Verifying Image Workspace OpenRouter Integration & HTML Integrity ---');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Verify exact model IDs present in HTML dropdown and IMAGE_MODELS
const requiredModelIds = [
  'openai/gpt-image-2.5-sunburst',
  'google/gemini-3-pro-image',
  'black-forest-labs/flux.2-pro',
  'bytedance-seed/seedream-5.0-pro',
  'meta/muse-image',
  'google/gemini-3.1-flash-image-preview'
];

requiredModelIds.forEach(id => {
  assert(html.includes(`data-model="${id}"`), `HTML must contain dropdown option with data-model="${id}"`);
  assert(html.includes(`id: "${id}"`), `IMAGE_MODELS must contain id "${id}"`);
  console.log(`[PASS] Exact Model ID present: ${id}`);
});

// 2. Verify Lightbox Actions (Download, Copy, Share)
assert(html.includes('id="studio-lightbox-download-btn"'), 'Lightbox has download button');
assert(html.includes('id="studio-lightbox-copy-btn"'), 'Lightbox has copy button');
assert(html.includes('id="studio-lightbox-share-btn"'), 'Lightbox has share button');
assert(html.includes('id="studio-lightbox-close-btn"'), 'Lightbox has close button');
console.log('[PASS] Lightbox Download, Copy, Share, and Close action buttons present');

// 3. Verify Lightbox JS Listeners
assert(html.includes('lightboxShareBtn.addEventListener'), 'JS binds share action');
assert(html.includes('lightboxCopyBtn.addEventListener'), 'JS binds copy action');
assert(html.includes('lightboxDownloadBtn.addEventListener'), 'JS binds download action');
console.log('[PASS] Lightbox event listeners wired up for all actions');

// 4. Verify Real API call in generateStudioImages
assert(html.includes("fetch(`${apiBase}/api/generate-image`"), 'generateStudioImages calls backend route /api/generate-image');
assert(html.includes('STUDIO_RECENT_IMAGES.unshift'), 'New generated images prepended to Recent Images grid');
assert(html.includes('saveStoredRecentImages'), 'Persists recent images');
assert(html.includes('renderStudioRecentImages'), 'Renders recent images gallery');
assert(html.includes('renderStudioResults'), 'Renders generated results');
assert(html.includes('showStudioToast'), 'Shows user feedback toast on success and error');
console.log('[PASS] Real API route integration, gallery update, and feedback verified');

// 5. Test Live Backend Route /api/generate-image
async function testLiveBackend() {
  console.log('\n--- Testing Live Backend /api/generate-image ---');
  try {
    const res = await fetch('http://localhost:5001/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A brilliant sapphire gemstone crystal, studio lighting',
        model: 'openai/gpt-image-2.5-sunburst',
        aspectRatio: '1:1',
        count: 1
      })
    });

    assert.strictEqual(res.status, 200, 'Backend returns 200 OK');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Response success is true');
    assert(Array.isArray(data.images) && data.images.length === 1, 'Returns 1 image in images array');
    const img = data.images[0];
    assert(img.url && (img.url.startsWith('data:image/') || img.url.startsWith('http')), 'Image URL is valid displayable format');
    assert.strictEqual(img.aspectRatio, '1:1', 'Aspect ratio is 1:1');
    assert(img.createdAt, 'Timestamp attached');
    console.log('[PASS] Live generation successful! Image format:', img.url.slice(0, 35) + '...');

    // 6. Test Error Handling (e.g. empty prompt)
    const errRes = await fetch('http://localhost:5001/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '', model: 'openai/gpt-image-2.5-sunburst' })
    });
    assert.strictEqual(errRes.status, 400, 'Empty prompt returns 400 Bad Request');
    const errData = await errRes.json();
    assert.strictEqual(errData.error, true, 'Error response flag set');
    assert(errData.message, 'Informative error message returned');
    console.log('[PASS] Error handling correctly returns clean error message without crash');

    console.log('\nALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('[FAIL] Live backend test error:', err);
    process.exit(1);
  }
}

testLiveBackend();
