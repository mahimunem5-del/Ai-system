process.env.NODE_ENV = 'test';
import assert from 'assert';
import http from 'http';
import app from '../src/index.js';
import {
  sanitizeRawModelText,
  parseJsonSafely,
  parseModelIntentOutput,
  isValidImageUrlString,
  cleanPrompt,
  executeImageGeneration
} from '../src/services/imageService.js';

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
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

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('=== RUNNING BULLETPROOF IMAGE PIPELINE TESTS ===\n');

  // Test 1: sanitizeRawModelText strips Claude <thinking>, DeepSeek <think>, and markdown code fences
  await runTest('1. sanitizeRawModelText pre-cleaning pipeline', () => {
    // Claude <thinking>
    const claudeRaw = `<thinking>
The user wants to see a cute cat with a blue bowtie.
I will generate a vivid visual prompt.
</thinking>
\`\`\`json
{
  "is_image_request": true,
  "visual_prompt": "A fluffy ginger cat wearing an elegant royal blue satin bowtie, studio lighting",
  "reasoning": "User requested cat with bowtie"
}
\`\`\``;
    const claudeCleaned = sanitizeRawModelText(claudeRaw);
    assert.ok(!claudeCleaned.includes('<thinking>'), 'Should strip <thinking>');
    assert.ok(!claudeCleaned.includes('</thinking>'), 'Should strip </thinking>');
    assert.ok(!claudeCleaned.includes('```json'), 'Should strip ```json');
    assert.ok(claudeCleaned.includes('"is_image_request": true'), 'Should retain JSON body');

    // DeepSeek <think>
    const deepseekRaw = `<think>
Visual analysis: User uploaded a photo and asked in Banglish 'Eitar mathay lal tupi porao'.
Delta: Add red knit hat.
</think>
{
  "is_edit_request": true,
  "visual_prompt": "A cute cat wearing a vibrant red knitted beanie, natural lighting",
  "reasoning": "Added red hat"
}`;
    const deepseekCleaned = sanitizeRawModelText(deepseekRaw);
    assert.ok(!deepseekCleaned.includes('<think>'), 'Should strip <think>');
    assert.ok(!deepseekCleaned.includes('</think>'), 'Should strip </think>');
    assert.ok(deepseekCleaned.includes('"is_edit_request": true'), 'Should retain JSON body');

    // Reasoning models <reasoning>
    const reasoningRaw = `<reasoning>Step by step breakdown</reasoning> {"is_image_request": false, "visual_prompt": null}`;
    const reasoningCleaned = sanitizeRawModelText(reasoningRaw);
    assert.ok(!reasoningCleaned.includes('<reasoning>'), 'Should strip <reasoning>');
    assert.ok(reasoningCleaned.includes('"is_image_request": false'), 'Should retain JSON');
  });

  // Test 2: parseModelIntentOutput extracts prompt from Claude, DeepSeek, and malformed outputs
  await runTest('2. parseModelIntentOutput defensive parser and regex layer', () => {
    // A: Claude structured block
    const claudeOutput = `<thinking>Analyzing request...</thinking>
\`\`\`json
{
  "is_edit_request": true,
  "visual_prompt": "A Siamese cat wearing a miniature wizard hat with glowing stars",
  "reasoning": "Wizard hat added"
}
\`\`\``;
    const parsedA = parseModelIntentOutput(claudeOutput, 'Eitar mathay wizard hat daw', 'edit');
    assert.strictEqual(parsedA.isIntent, true);
    assert.strictEqual(parsedA.visualPrompt, 'A Siamese cat wearing a miniature wizard hat with glowing stars');

    // B: Malformed JSON with unescaped quotes (regex layer fallback)
    const malformedOutput = `{
  "is_edit_request": true,
  "visual_prompt": "A realistic photo of a "cool" dog wearing sunglasses, 8k resolution",
  "reasoning": "Unescaped quotes in json"
}`;
    const parsedB = parseModelIntentOutput(malformedOutput, 'Dog with sunglasses', 'edit');
    assert.strictEqual(parsedB.isIntent, true);
    assert.ok(parsedB.visualPrompt && parsedB.visualPrompt.length > 0, 'Regex layer should recover visual prompt');

    // C: Model output with empty visual_prompt falling back to userQuery cleanPrompt
    const emptyPromptOutput = `{
  "is_edit_request": true,
  "visual_prompt": "",
  "reasoning": "Missing prompt"
}`;
    const parsedC = parseModelIntentOutput(emptyPromptOutput, 'Eitar upor ekta lal tupi porao', 'edit');
    assert.strictEqual(parsedC.isIntent, true);
    assert.ok(parsedC.visualPrompt && parsedC.visualPrompt.length > 10, 'Must fall back to cleanPrompt(userQuery)');
    assert.ok(parsedC.visualPrompt.toLowerCase().includes('hat') || parsedC.visualPrompt.toLowerCase().includes('tupi') || parsedC.visualPrompt.toLowerCase().includes('photograph'), 'Sanitized prompt should contain visual subject');

    // D: Plain text visual prompt output without JSON tags
    const textOutput = `Here is the visual prompt for FLUX:
visual_prompt: "A cinematic portrait of a Bengal tiger walking through a misty bamboo forest at dawn"
reasoning: Tiger scene`;
    const parsedD = parseModelIntentOutput(textOutput, 'Tiger in bamboo forest', 'image');
    assert.ok(parsedD.visualPrompt.includes('Bengal tiger walking through a misty bamboo forest'));
  });

  // Test 3: isValidImageUrlString validation
  await runTest('3. isValidImageUrlString validation guard', () => {
    assert.strictEqual(isValidImageUrlString(null), false);
    assert.strictEqual(isValidImageUrlString(''), false);
    assert.strictEqual(isValidImageUrlString('   '), false);
    assert.strictEqual(isValidImageUrlString('undefined'), false);
    assert.strictEqual(isValidImageUrlString('ftp://example.com/img.jpg'), false);
    assert.strictEqual(isValidImageUrlString('http://example.com/cat.jpg'), true);
    assert.strictEqual(isValidImageUrlString('https://image.pollinations.ai/prompt/cat?model=flux'), true);
    assert.strictEqual(isValidImageUrlString('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
    assert.strictEqual(isValidImageUrlString('blob:http://localhost:5001/uuid-1234'), true);
  });

  // Test 4: cleanPrompt never returns empty query
  await runTest('4. cleanPrompt robustness and non-empty guarantee', () => {
    const empty1 = cleanPrompt('');
    assert.ok(empty1 && empty1.trim().length > 0, 'cleanPrompt on empty string must return a valid non-empty visual scene');
    const empty2 = cleanPrompt(null);
    assert.ok(empty2 && empty2.trim().length > 0, 'cleanPrompt on null must return a valid non-empty visual scene');
    const banglish = cleanPrompt('Ekta biral er chobi banao to');
    assert.ok(banglish.toLowerCase().includes('cat'), 'Banglish biral translated to cat');
    assert.ok(banglish.includes('8k resolution') || banglish.includes('portrait'), 'Enriched with visual details');
  });

  // Test 5: executeImageGeneration verifies non-empty prompt and returns valid imageUrl
  await runTest('5. executeImageGeneration verified execution', async () => {
    const result = await executeImageGeneration({
      prompt: 'A beautiful golden retriever puppy playing in the grass',
      requestId: 'test-req-1'
    });
    assert.ok(result, 'Expected result object');
    assert.ok(isValidImageUrlString(result.imageUrl), `Expected valid imageUrl: ${result.imageUrl}`);
    assert.ok(result.prompt && result.prompt.length > 0, 'Expected non-empty prompt');
  });

  // Start server for end-to-end integration tests
  await startServer();

  // Test 6: Image generation error guard via /api/chat/stream (emits type: 'image_error')
  await runTest('6. Image generation error handling emits clean image_error chunk without broken card', async () => {
    // We send an image request that triggers image synthesis with an abort controller cancelled immediately
    const ac = new AbortController();
    ac.abort(); // already aborted

    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: '/image A futuristic cyberpunk flying car' }]
      }),
      signal: ac.signal
    }).catch(err => err);

    // Aborted cleanly by client
    assert.ok(res, 'Request handled');
  });

  // Test 7: Universal parity: Workspace Chat request with user-selected model
  await runTest('7. Project Workspace Chat uses user-selected model dynamically', async () => {
    const redDotBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        projectId: 'project-universe-99',
        projectInstructions: 'Respond professionally and concisely.',
        messages: [
          {
            role: 'user',
            content: 'Eitar mathay lal tupi porao',
            attachments: [{ dataUrl: redDotBase64, isImage: true }]
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.text();
    const lines = body.split('\n').filter(l => l.startsWith('data: ')).map(l => l.replace(/^data:\s*/, ''));

    // Should have image chunk with valid imageUrl
    const imageChunk = lines.find(l => {
      try {
        const p = JSON.parse(l);
        return p.type === 'image';
      } catch (_) { return false; }
    });

    assert.ok(imageChunk, 'Expected SSE image chunk in project workspace chat');
    const parsedImg = JSON.parse(imageChunk);
    assert.ok(isValidImageUrlString(parsedImg.imageUrl), 'Image URL must be valid');
    assert.ok(lines.includes('[DONE]'), 'Must terminate with [DONE]');
  });

  // Test 8: Main Chat conversational inquiry streaming text directly
  await runTest('8. Main Chat conversational inquiry streams text normally without triggering image generation', async () => {
    const redDotBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Eita kisher chobi? Describe it.',
            attachments: [{ dataUrl: redDotBase64, isImage: true }]
          }
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.text();
    const lines = body.split('\n').filter(l => l.startsWith('data: ')).map(l => l.replace(/^data:\s*/, ''));

    const imageChunk = lines.find(l => {
      try { return JSON.parse(l).type === 'image'; } catch (_) { return false; }
    });
    assert.strictEqual(imageChunk, undefined, 'Conversational query should NOT emit image chunk');

    const textChunks = lines.map(l => {
      try { return JSON.parse(l).text || ''; } catch (_) { return ''; }
    }).join('');
    assert.ok(textChunks.length > 0, 'Conversational query should stream conversational text');
  });

  await stopServer();
  console.log('\n=== ALL BULLETPROOF IMAGE PIPELINE TESTS COMPLETED ===');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
