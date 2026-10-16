/**
 * Comprehensive Verification Suite for Dynamic Model Vision-to-Image Pipeline
 * Tests:
 * 1. Dynamic Model Intent Router with multiple selected models (e.g. gpt-4o-mini, mahi-engine)
 * 2. Visual Delta Prompt Synthesis via the selected active model
 * 3. End-to-end Image Generation flow via /api/chat/stream with user-selected model
 * 4. End-to-end Conversational Vision Query flow via /api/chat/stream with user-selected model
 * 5. Project Workspace Chat compatibility (works identically with selected model, projectId & projectInstructions)
 */

import assert from 'assert';
import app from '../src/index.js';
import {
  extractAttachedImageFromMessage,
  findMostRecentImage,
  isModificationOrReference,
  routeMultimodalIntentAndSynthesizeDelta,
  detectAndEnrichImageIntent
} from '../src/services/imageService.js';

let server;
let baseUrl;

const redDotBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
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

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    process.stdout.write(`• Testing: ${name}... `);
    await fn();
    console.log('✓ PASSED');
    passed++;
  } catch (err) {
    console.log('✗ FAILED');
    console.error(`  Error: ${err.message}`);
    if (err.stack) console.error(err.stack.split('\n').slice(1, 3).join('\n'));
    failed++;
  }
}

async function readSseStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const events = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') {
        events.push({ type: 'done' });
      } else {
        try {
          events.push(JSON.parse(dataStr));
        } catch (_) {
          events.push({ raw: dataStr });
        }
      }
    }
  }

  return events;
}

async function main() {
  console.log('\n======================================================');
  console.log('  DYNAMIC MODEL VISION-TO-IMAGE INTEGRATION SUITE');
  console.log('======================================================\n');

  await startServer();

  // Test 1: Helper extraction functions
  await runTest('extractAttachedImageFromMessage extracts from multimodal array, attachments, and imageUrl', async () => {
    const msgArray = {
      role: 'user',
      content: [
        { type: 'text', text: 'Eitar mathay lal tupi porao' },
        { type: 'image_url', image_url: { url: redDotBase64 } }
      ]
    };
    assert.strictEqual(extractAttachedImageFromMessage(msgArray), redDotBase64);

    const msgAtt = {
      role: 'user',
      content: 'Here is my file',
      attachments: [{ isImage: true, dataUrl: redDotBase64 }]
    };
    assert.strictEqual(extractAttachedImageFromMessage(msgAtt), redDotBase64);

    const msgDirect = {
      role: 'assistant',
      content: '',
      imageUrl: 'https://example.com/cat.jpg'
    };
    assert.strictEqual(extractAttachedImageFromMessage(msgDirect), 'https://example.com/cat.jpg');
  });

  // Test 2: Reference detection
  await runTest('isModificationOrReference identifies Banglish and English edit modifiers', async () => {
    assert.strictEqual(isModificationOrReference('Eitar mathay lal tupi porao'), true);
    assert.strictEqual(isModificationOrReference('eitar background snow kore daw'), true);
    assert.strictEqual(isModificationOrReference('Add sunglasses to the dog'), true);
    assert.strictEqual(isModificationOrReference('Change color to neon blue'), true);
    assert.strictEqual(isModificationOrReference('What is the capital of France?'), false);
    assert.strictEqual(isModificationOrReference('How does quicksort work?'), false);
  });

  // Test 3: Dynamic Model Intent Router with GPT-4o Mini selected
  await runTest('Dynamic Model: GPT-4o Mini acts as primary brain for Edit Request ("Eitar mathay lal tupi porao")', async () => {
    const result = await routeMultimodalIntentAndSynthesizeDelta({
      model: 'openai/gpt-4o-mini',
      query: 'Eitar mathay lal tupi porao',
      imageUrl: redDotBase64,
      requestId: 'test-gpt4o-edit'
    });
    assert.strictEqual(result.is_edit_request, true);
    assert.ok(result.visual_prompt && typeof result.visual_prompt === 'string');
    assert.ok(result.visual_prompt.length > 10);
    assert.match(result.visual_prompt.toLowerCase(), /hat|tupi|cap|red/);
  });

  // Test 4: Dynamic Model Intent Router with GPT-4o Mini for Conversational Query
  await runTest('Dynamic Model: GPT-4o Mini acts as primary brain for Conversational Query ("Eita kisher chobi?")', async () => {
    const result = await routeMultimodalIntentAndSynthesizeDelta({
      model: 'openai/gpt-4o-mini',
      query: 'Eita kisher chobi?',
      imageUrl: redDotBase64,
      requestId: 'test-gpt4o-query'
    });
    assert.strictEqual(result.is_edit_request, false);
    assert.strictEqual(result.visual_prompt, null);
  });

  // Test 5: Dynamic Model Intent Router with Mahi Engine selected
  await runTest('Dynamic Model: Mahi Engine acts as primary brain for Edit Request ("Eitar mathay lal tupi porao")', async () => {
    const result = await routeMultimodalIntentAndSynthesizeDelta({
      model: 'mahi-engine',
      query: 'Eitar mathay lal tupi porao',
      imageUrl: redDotBase64,
      requestId: 'test-mahi-edit'
    });
    assert.strictEqual(result.is_edit_request, true);
    assert.ok(result.visual_prompt && typeof result.visual_prompt === 'string');
    assert.match(result.visual_prompt.toLowerCase(), /hat|beanie|cap|red/);
  });

  // Test 6: Main Chat End-to-End Image Edit Request with GPT-4o Mini selected
  await runTest('Main Chat with GPT-4o Mini: Edit Request streams loader, image card, [DONE], zero text', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Eitar mathay lal tupi porao' },
              { type: 'image_url', image_url: { url: redDotBase64 } }
            ]
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const events = await readSseStream(res);

    // 1. Should have status event: "Generating image..."
    const statusEv = events.find(e => e.type === 'status');
    assert.ok(statusEv, 'Expected status event');
    assert.strictEqual(statusEv.message, 'Generating image...');

    // 2. Should have image event with imageUrl
    const imageEv = events.find(e => e.type === 'image');
    assert.ok(imageEv, 'Expected image event');
    assert.ok(imageEv.imageUrl, 'Expected valid imageUrl');

    // 3. Should end with [DONE]
    const doneEv = events.find(e => e.type === 'done');
    assert.ok(doneEv, 'Expected [DONE] stream termination');

    // 4. Must NOT have streamed descriptive text underneath
    const textEvs = events.filter(e => typeof e.text === 'string');
    assert.strictEqual(textEvs.length, 0, 'Expected zero text events underneath image');
  });

  // Test 7: Main Chat End-to-End Conversational Query with GPT-4o Mini selected
  await runTest('Main Chat with GPT-4o Mini: Conversational Query ("Eita kisher chobi?") streams vision text directly from selected model', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Eita kisher chobi?' },
              { type: 'image_url', image_url: { url: redDotBase64 } }
            ]
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const events = await readSseStream(res);

    // Should NOT generate an image for conversational inquiry
    const imageEv = events.find(e => e.type === 'image');
    assert.strictEqual(imageEv, undefined, 'Should not generate image for conversational query');

    // Should stream text chunks directly
    const textEvs = events.filter(e => typeof e.text === 'string');
    assert.ok(textEvs.length > 0, 'Expected streamed text chunks');
    const fullText = textEvs.map(e => e.text).join('');
    assert.ok(fullText.length > 5, 'Expected vision explanation text');

    // Should end with [DONE]
    const doneEv = events.find(e => e.type === 'done');
    assert.ok(doneEv, 'Expected [DONE] termination');
  });

  // Test 8: Project Workspace Chat with GPT-4o Mini
  await runTest('Project Workspace Chat with GPT-4o Mini: operates seamlessly with projectId and projectInstructions', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        projectId: 'proj-brand-identity',
        projectInstructions: 'Brand design workspace',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Eitar upor ekta choshma lagao' },
              { type: 'image_url', image_url: { url: redDotBase64 } }
            ]
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const events = await readSseStream(res);

    const statusEv = events.find(e => e.type === 'status');
    assert.ok(statusEv, 'Expected status event');
    assert.strictEqual(statusEv.message, 'Generating image...');

    const imageEv = events.find(e => e.type === 'image');
    assert.ok(imageEv, 'Expected image event');
    assert.ok(imageEv.imageUrl, 'Expected valid imageUrl');

    const doneEv = events.find(e => e.type === 'done');
    assert.ok(doneEv, 'Expected [DONE]');
  });

  // Test 9: Project Workspace Chat Conversational Query with Mahi Engine
  await runTest('Project Workspace Chat with Mahi Engine: Conversational Query streams vision text response adhering to workspace', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mahi-engine',
        projectId: 'proj-audit-docs',
        projectInstructions: 'Answer briefly in 1 sentence',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe what color this image is in one sentence.' },
              { type: 'image_url', image_url: { url: redDotBase64 } }
            ]
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const events = await readSseStream(res);

    const textEvs = events.filter(e => typeof e.text === 'string');
    assert.ok(textEvs.length > 0, 'Expected streamed text chunks');
    const fullText = textEvs.map(e => e.text).join('');
    assert.ok(fullText.length > 5, 'Expected vision text explanation');

    const doneEv = events.find(e => e.type === 'done');
    assert.ok(doneEv, 'Expected [DONE]');
  });

  await stopServer();

  console.log(`\n======================================================`);
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
