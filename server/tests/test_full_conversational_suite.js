process.env.NODE_ENV = 'test';
import assert from 'assert';
import app from '../src/index.js';
import http from 'http';
import {
  resolveOpenRouterImageModel,
  resolveDimensions
} from '../src/controllers/imageController.js';
import {
  orchestrateImageWorkspaceTurn
} from '../src/services/imageService.js';

console.log('======================================================');
console.log('  MESTRIO AI IMAGE WORKSPACE CONVERSATIONAL TEST SUITE');
console.log('======================================================\n');

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Running on ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function runSuite() {
  await startServer();

  try {
    // TEST 1: Empty prompt validation
    console.log('Test 1: Empty prompt validation on /api/generate-image...');
    const res1 = await fetch(`${baseUrl}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '', model: 'openai/gpt-image-2.5-sunburst' })
    });
    assert.strictEqual(res1.status, 400, 'Empty prompt must return 400');
    const data1 = await res1.json();
    assert.strictEqual(data1.error, true);
    assert(data1.message.includes('required'));
    console.log('✓ Test 1 Passed: Empty prompt rejected with 400');

    // TEST 2: Conversational Question (NORMAL_CONVERSATION) -> Should return text without image generation
    console.log('\nTest 2: Normal conversation question handling via Mahi Engine...');
    const res2 = await fetch(`${baseUrl}/api/images/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'What is the difference between cinematic lighting and realistic lighting in photography?',
        messages: [],
        conversationId: 'test_conv_1',
        model: 'openai/gpt-image-2.5-sunburst'
      })
    });
    assert.strictEqual(res2.status, 200, 'Conversation request must return 200');
    const data2 = await res2.json();
    assert.strictEqual(data2.success, true);
    assert(data2.intent === 'NORMAL_CONVERSATION' || data2.intent === 'IMAGE_DISCUSSION', `Expected text intent, got ${data2.intent}`);
    assert(Array.isArray(data2.images) && data2.images.length === 0, 'No images should be generated for text questions');
    assert(typeof data2.message === 'string' && data2.message.length > 20, 'Informative text response returned');
    console.log('✓ Test 2 Passed: Text question returns Mahi Engine explanation without calling image model');

    // TEST 3: Image Discussion Question (IMAGE_DISCUSSION) -> Should return text without image generation
    console.log('\nTest 3: Image discussion question handling...');
    const res3 = await fetch(`${baseUrl}/api/images/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Why does my previous render have shallow depth of field?',
        messages: [
          { role: 'user', content: 'Create a portrait of an elderly watchmaker in his workshop' },
          { role: 'assistant', content: 'Crafted portrait with shallow depth of field bokeh', imagePrompt: 'Portrait of elderly watchmaker in cozy workshop, f/1.4 aperture bokeh' }
        ],
        conversationId: 'test_conv_1',
        model: 'google/gemini-3-pro-image'
      })
    });
    assert.strictEqual(res3.status, 200);
    const data3 = await res3.json();
    assert.strictEqual(data3.success, true);
    assert(data3.intent === 'IMAGE_DISCUSSION' || data3.intent === 'NORMAL_CONVERSATION');
    assert(Array.isArray(data3.images) && data3.images.length === 0);
    assert(typeof data3.message === 'string' && data3.message.length > 20);
    console.log('✓ Test 3 Passed: Image discussion returns thoughtful critique without generating image');

    // TEST 4: Context-Aware Editing Intent Classification
    console.log('\nTest 4: Context-Aware Editing Intent with visual delta...');
    const editTurn = await orchestrateImageWorkspaceTurn({
      prompt: 'Make the room brighter with morning sunlight streaming through the windows',
      conversationHistory: [
        { role: 'user', content: 'A golden retriever resting on a rug in a modern living room' },
        { role: 'assistant', content: 'Rendering your golden retriever in a modern living room...', imagePrompt: 'A golden retriever resting on a soft grey rug in a modern minimalist living room' }
      ],
      model: 'black-forest-labs/flux.2-pro',
      aspectRatio: '16:9'
    });
    assert.strictEqual(editTurn.intent, 'IMAGE_EDITING');
    assert(typeof editTurn.optimizedPrompt === 'string');
    assert(editTurn.optimizedPrompt.toLowerCase().includes('golden retriever'));
    assert(editTurn.optimizedPrompt.toLowerCase().includes('sunlight') || editTurn.optimizedPrompt.toLowerCase().includes('bright'));
    console.log('✓ Test 4 Passed: Editing correctly identifies previous image subject and weaves delta');

    // TEST 5: Creative Variations Intent Classification
    console.log('\nTest 5: Image Variations Intent Classification...');
    const varTurn = await orchestrateImageWorkspaceTurn({
      prompt: 'Give me 3 different variations of this scene with different camera angles',
      conversationHistory: [
        { role: 'user', content: 'A futuristic electric supercar on a mountain pass at dusk' },
        { role: 'assistant', content: 'Generating supercar on mountain pass...', imagePrompt: 'Sleek aerodynamic electric supercar driving along winding alpine mountain pass at twilight' }
      ],
      model: 'bytedance-seed/seedream-5.0-pro'
    });
    assert(varTurn.intent === 'IMAGE_VARIATION' || varTurn.intent === 'IMAGE_EDITING');
    assert(typeof varTurn.optimizedPrompt === 'string');
    console.log('✓ Test 5 Passed: Variations intent correctly recognized and optimized');

    // TEST 6: Model Preservation & Aspect Ratio Resolution
    console.log('\nTest 6: Verify Model and Aspect Ratio are never overridden...');
    const allModels = [
      'openai/gpt-image-2.5-sunburst',
      'google/gemini-3-pro-image',
      'black-forest-labs/flux.2-pro',
      'bytedance-seed/seedream-5.0-pro',
      'meta/muse-image',
      'google/gemini-3.1-flash-image-preview'
    ];
    allModels.forEach(m => {
      const resolved = resolveOpenRouterImageModel(m);
      assert.strictEqual(resolved, m, `Model ${m} must resolve to itself without silent override`);
    });

    const allRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    allRatios.forEach(r => {
      const dim = resolveDimensions(r);
      assert.strictEqual(dim.aspect_ratio, r);
    });
    console.log('✓ Test 6 Passed: All 6 models and 5 aspect ratios strictly preserved');

    // TEST 7: Conversational flag routing on /api/generate-image
    console.log('\nTest 7: Verify /api/generate-image transparently delegates conversational calls...');
    const res7 = await fetch(`${baseUrl}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'What camera lens is best for portrait photography?',
        conversational: true,
        messages: [],
        model: 'openai/gpt-image-2.5-sunburst'
      })
    });
    assert.strictEqual(res7.status, 200);
    const data7 = await res7.json();
    assert.strictEqual(data7.success, true);
    assert(data7.intent === 'NORMAL_CONVERSATION' || data7.intent === 'IMAGE_DISCUSSION');
    console.log('✓ Test 7 Passed: /api/generate-image delegates to conversational pipeline');

    console.log('\n======================================================');
    console.log('  ALL 7 TESTS IN FULL SUITE PASSED PERFECTLY!         ');
    console.log('======================================================');
  } finally {
    await stopServer();
  }
}

runSuite().catch(err => {
  console.error('[SUITE FAILURE]:', err);
  process.exit(1);
});
