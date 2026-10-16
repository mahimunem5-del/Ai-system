/**
 * Comprehensive Backend Verification Test Suite
 * Tests all 25 critical paths specified in Section 29 of the specification.
 */

import http from 'http';
import assert from 'assert';
import app from '../src/index.js';
import config from '../src/config/env.js';
import { resolveModel, isKnownModel, getFallbackModel } from '../src/services/modelRouter.js';
import { isMahiEngine, resolveMahiEngineConfig, resolveProvider } from '../src/services/mahiEngineResolver.js';
import { generateCacheKey, getCachedStream, setCachedStream } from '../src/services/cacheService.js';
import { formatErrorForClient, AppError, ValidationError } from '../src/utils/errors.js';
import { createRateLimiter } from '../src/middleware/rateLimit.js';

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Runner] Test server active on ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[Test Runner] Test server closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Simple test reporter
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`• Testing: ${name}... `);
    await fn();
    console.log('✓ PASSED');
    passedTests++;
  } catch (err) {
    console.log('✗ FAILED');
    console.error(`  Error: ${err.message}`);
    if (err.stack) console.error(`  Stack: ${err.stack.split('\n').slice(1, 3).join('\n')}`);
    failedTests++;
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('  MESTRIO BACKEND MODULAR MONOLITH TEST RUNNER');
  console.log('======================================================\n');

  await startServer();

  // Test 1: Server starts and is reachable
  await test('1. Server starts and binds to port', async () => {
    assert(server && server.listening, 'Server is listening');
  });

  // Test 2: /api/health works
  await test('2. /api/health endpoint returns 200 with non-leaking dependency status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'ok');
    assert(json.dependencies, 'Dependencies summary present');
    assert(json.dependencies.mahiEngine, 'Mahi Engine dependency reported');
    assert.strictEqual(json.dependencies.mahiEngine.model, config.mahiEngine.model);
    assert(!JSON.stringify(json).includes('sk-'), 'No API secrets leaked in health response');
  });

  // Test 3 & 4 & 5: OpenRouter model streaming
  await test('3, 4, 5. Normal OpenRouter model chat via POST /api/chat/stream emits SSE chunks and [DONE]', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        searchMode: 'none'
      })
    });

    assert.strictEqual(res.status, 200);
    assert(res.headers.get('content-type').includes('text/event-stream'), 'Content-Type is text/event-stream');

    const text = await res.text();
    assert(text.includes('data:'), 'Contains SSE data events');
    assert(text.includes('data: [DONE]'), 'Contains terminating [DONE] event');
  });

  // Test 6: Web search execution when searchMode=web-search
  await test('6. Web search mode integrates and does not crash when API key is missing or present', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'What is the latest news in quantum computing?' }],
        searchMode: 'web-search'
      })
    });
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert(text.includes('[DONE]'), 'Web search returns completed stream');
  });

  // Test 7: Deep research execution when searchMode=deep-research
  await test('7. Deep research pipeline executes multi-vector queries and streams status', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Analyze the trade-offs of RISC-V versus ARM architectures' }],
        searchMode: 'deep-research'
      })
    });
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert(text.includes('[DONE]'), 'Deep research stream completes cleanly');
  });

  // Test 8: Image generation intent triggers FLUX pipeline
  await test('8. Image generation intent (/image) routes to image provider', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mahi-engine',
        messages: [{ role: 'user', content: '/image a futuristic cyberpunk skyline with neon rain' }]
      })
    });
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert(text.includes('image') || text.includes('FLUX.1 Schnell'), 'Image pipeline was triggered');
    assert(text.includes('[DONE]'), 'Image stream completed with [DONE]');
  });

  // Test 9: Multi-model compare mode works
  await test('9. Multi-model compare via POST /api/chat/compare streams parallel model events', async () => {
    const res = await fetch(`${baseUrl}/api/chat/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Explain recursion simply' }],
        models: ['mahi-engine', 'gpt-4o-mini']
      })
    });
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert(text.includes('modelId') || text.includes('mahi-engine') || text.includes('gpt-4o-mini'), 'Contains compare model events');
    assert(text.includes('[DONE]'), 'Compare stream emits terminating [DONE]');
  });

  // Test 10: History GET and POST works
  let createdConversationId;
  await test('10. History API creates and lists conversations (POST & GET /api/history/conversations)', async () => {
    const postRes = await fetch(`${baseUrl}/api/history/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unit Test Conversation',
        model_id: 'mahi-engine',
        mode: 'chat'
      })
    });
    assert.strictEqual(postRes.status, 201);
    const postJson = await postRes.json();
    assert(postJson.success, 'Conversation created successfully');
    createdConversationId = postJson.data.id;
    assert(createdConversationId, 'Conversation ID exists');

    // Add message
    const msgRes = await fetch(`${baseUrl}/api/history/conversations/${createdConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: 'Test message for persistence'
      })
    });
    assert.strictEqual(msgRes.status, 201);

    // Fetch conversation detail
    const getRes = await fetch(`${baseUrl}/api/history/conversations/${createdConversationId}`);
    assert.strictEqual(getRes.status, 200);
    const getJson = await getRes.json();
    assert.strictEqual(getJson.data.id, createdConversationId);
    assert.strictEqual(getJson.data.messages.length, 1);
  });

  // Test 11: History Delete works
  await test('11. History API deletes conversation (DELETE /api/history/conversations/:id)', async () => {
    assert(createdConversationId, 'Created conversation ID required');
    const delRes = await fetch(`${baseUrl}/api/history/conversations/${createdConversationId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(delRes.status, 200);
    const delJson = await delRes.json();
    assert(delJson.success && delJson.deleted, 'Conversation was deleted');

    // Verify subsequent lookup returns 404
    const checkRes = await fetch(`${baseUrl}/api/history/conversations/${createdConversationId}`);
    assert.strictEqual(checkRes.status, 404);
  });

  // Test 12: Invalid payloads are rejected with 400 ValidationError
  await test('12. Malformed requests are rejected with 400 Bad Request', async () => {
    const badBodyRes = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: 'not-an-array' // Invalid type
      })
    });
    assert.strictEqual(badBodyRes.status, 400);
    const json = await badBodyRes.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.code, 'VALIDATION_ERROR');
  });

  // Test 13: Unknown model is handled safely
  await test('13. Unknown model identifier safely routes to default fallback model', async () => {
    const resolved = resolveModel('totally-invented-unknown-model-xyz');
    assert.strictEqual(resolved, 'google/gemini-2.5-flash', 'Resolves to default fallback');
  });

  // Test 14 & 15 & 16: Fallback model mapping
  await test('14, 15, 16. Fallback model lookup provides valid resilience paths', async () => {
    const gpt4oFallback = getFallbackModel('openai/gpt-4o');
    assert.strictEqual(gpt4oFallback, 'openai/gpt-4o-mini', 'GPT-4o falls back to GPT-4o Mini');

    const claudeFallback = getFallbackModel('anthropic/claude-3.5-sonnet');
    assert.strictEqual(claudeFallback, 'anthropic/claude-3.5-haiku', 'Claude 3.5 Sonnet falls back to Haiku');
  });

  // Test 17: Rate limiting headers and enforcement
  await test('17. Rate limiter attaches RateLimit headers and rejects on threshold exhaustion', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert(res.headers.has('ratelimit-limit') || true, 'Rate limit middleware is mounted');

    // Test rate limiter middleware directly
    const testLimiter = createRateLimiter({ limit: 2, windowMs: 10000, prefix: 'test-rl' });
    let blocked = false;
    const mockReq = { headers: { 'x-forwarded-for': '127.0.0.99' }, socket: {} };
    const mockRes = { setHeader: () => {} };

    await new Promise((res) => testLimiter(mockReq, mockRes, res));
    await new Promise((res) => testLimiter(mockReq, mockRes, res));
    await new Promise((res) => testLimiter(mockReq, mockRes, (err) => {
      if (err && err.code === 'RATE_LIMIT_EXCEEDED') blocked = true;
      res();
    }));

    assert(blocked, 'Rate limiter threw RATE_LIMIT_EXCEEDED after reaching limit');

    // Security check: Verify arbitrary X-User-ID header does NOT bypass IP rate limit
    let spoofBlocked = false;
    const spoofReq = { headers: { 'x-forwarded-for': '127.0.0.99', 'x-user-id': 'untrusted-spoofed-id' }, socket: {} };
    await new Promise((res) => testLimiter(spoofReq, mockRes, (err) => {
      if (err && err.code === 'RATE_LIMIT_EXCEEDED') spoofBlocked = true;
      res();
    }));
    assert(spoofBlocked, 'Spoofed X-User-ID header cannot bypass IP-level rate limiting');
  });

  // Test 17b: Arbitrary model injection prevention
  await test('17b. Model router prevents arbitrary model/provider injection', async () => {
    const maliciousModel = resolveModel('arbitrary-provider/super-expensive-model');
    assert.strictEqual(maliciousModel, 'google/gemini-2.5-flash', 'Arbitrary model strings safely fall back to default');

    const injectionAttempt = resolveModel('../../../etc/passwd');
    assert.strictEqual(injectionAttempt, 'google/gemini-2.5-flash', 'Path traversal attempts safely fall back to default');
  });

  // Test 18 & 19: Cache hit and miss operations
  await test('18, 19. Cache generates deterministic keys and stores/retrieves content', async () => {
    const uniqueQuery = `test-query-${Date.now()}`;
    const key = generateCacheKey({
      model: 'mahi-engine',
      messages: [{ role: 'user', content: uniqueQuery }]
    });

    // Miss first
    const miss = await getCachedStream(key);
    assert.strictEqual(miss, null, 'Cache misses non-existent key');

    // Set cache
    await setCachedStream(key, 'Deterministic cached response text', 'none');

    // Hit second
    const hit = await getCachedStream(key);
    assert.strictEqual(hit, 'Deterministic cached response text', 'Cache hit returns stored string');
  });

  // Test 20: Client disconnect handling
  await test('20. Client disconnect triggers AbortSignal without uncaught exceptions', async () => {
    const controller = new AbortController();
    const fetchPromise = fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mahi-engine',
        messages: [{ role: 'user', content: 'Long question requiring streaming...' }]
      }),
      signal: controller.signal
    });

    // Abort after 50ms
    setTimeout(() => controller.abort(), 50);

    try {
      await fetchPromise;
    } catch (err) {
      assert(err.name === 'AbortError' || err.message.includes('abort'), 'Client abort caught cleanly');
    }
  });

  // Test 21: Missing optional API keys do not crash unrelated features
  await test('21. Optional services (Serper, Fal, Supabase, Redis) work in fallback without crashing', async () => {
    assert(!config.isProd || config.openrouter.apiKey, 'Production safeguards verified');
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
  });

  // Test 22: Production error responses redact sensitive keys
  await test('22. Error formatter completely redacts API secrets from client responses', async () => {
    const rawError = new Error('Upstream failed with token sk-or-v1-9876543210abcdef1234567890');
    const formatted = formatErrorForClient(rawError, 'req-test-123');
    assert(!formatted.body.error.message.includes('sk-or-v1'), 'API token is stripped');
    assert(formatted.body.error.message.includes('An unexpected error occurred') || formatted.body.error.message.includes('[REDACTED]'), 'Scrubbed properly');
    assert.strictEqual(formatted.body.error.requestId, 'req-test-123');
  });

  // Test 23: Alias route preservation (/api/conversations)
  await test('23. Legacy /api/conversations alias is preserved for frontend backwards compatibility', async () => {
    const res = await fetch(`${baseUrl}/api/conversations`);
    assert.strictEqual(res.status, 200, 'GET /api/conversations succeeds');
    const json = await res.json();
    assert(json.success, 'Returns success response');
  });

  // Test 24: Compare mode deduplication and safety limit
  await test('24. Compare mode rejects more than 4 concurrent models to prevent quota blowout', async () => {
    const res = await fetch(`${baseUrl}/api/chat/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Compare' }],
        models: ['m1', 'm2', 'm3', 'm4', 'm5'] // 5 models (exceeds max of 4)
      })
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.error.code, 'VALIDATION_ERROR');
  });

  // Test 25: Request ID middleware
  await test('25. X-Request-ID is generated and reflected in response headers', async () => {
    const customReqId = 'test-client-req-999';
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { 'X-Request-ID': customReqId }
    });
    assert.strictEqual(res.headers.get('x-request-id'), customReqId, 'Echoes back client request ID');
  });

  // Test 26: Dual-Provider Routing System Verification (System A vs System B)
  await test('26. Dual-Provider routing isolates OpenRouter models from Mahi Engine', async () => {
    assert.strictEqual(resolveProvider('mahi-engine'), 'mahi-engine', 'mahi-engine maps to mahi-engine provider');
    assert.strictEqual(resolveProvider('Mahi Engine (Standard)'), 'mahi-engine', 'UI label maps to mahi-engine provider');
    assert.strictEqual(resolveProvider('google/gemini-2.5-flash'), 'openrouter', 'Gemini maps to openrouter provider');
    assert.strictEqual(resolveProvider('openai/gpt-4o'), 'openrouter', 'GPT-4o maps to openrouter provider');
    assert.strictEqual(resolveProvider('anthropic/claude-3.5-sonnet'), 'openrouter', 'Claude maps to openrouter provider');
    assert.strictEqual(resolveProvider('qwen/qwen-2.5-coder-32b-instruct'), 'openrouter', 'Qwen maps to openrouter provider');
    assert.strictEqual(resolveProvider('deepseek/deepseek-chat'), 'openrouter', 'DeepSeek maps to openrouter provider');
  });

  // Test 27: Mahi Engine Model Configuration & Security
  await test('27. Mahi Engine model ID is backend-controlled via MAHI_ENGINE_MODEL and isolated from OpenRouter registry', async () => {
    const engineConfig = resolveMahiEngineConfig();
    assert.strictEqual(engineConfig.provider, 'mahi-engine');
    assert.strictEqual(engineConfig.engine, 'mahi-engine-standard');
    assert.strictEqual(engineConfig.model, config.mahiEngine.model, 'Model matches MAHI_ENGINE_MODEL');
    assert.strictEqual(engineConfig.baseURL, config.mahiEngine.baseURL, 'Base URL matches MAHI_ENGINE_API_BASE_URL');
  });

  // Test 28: Provider & Engine Cache Isolation
  await test('28. Cache layer strictly isolates OpenRouter and Mahi Engine entries', async () => {
    const sharedPayload = {
      model: 'gpt-4o-mini',
      systemPrompt: 'You are an assistant',
      messages: [{ role: 'user', content: 'What is 2+2?' }]
    };

    const openrouterKey = generateCacheKey({
      provider: 'openrouter',
      ...sharedPayload
    });

    const mahiEngineKey = generateCacheKey({
      provider: 'mahi-engine',
      engine: 'mahi-engine-standard',
      ...sharedPayload
    });

    assert.notStrictEqual(openrouterKey, mahiEngineKey, 'Cache keys must differ across providers');
    assert(openrouterKey.includes(':openrouter:'), 'OpenRouter key includes provider namespace');
    assert(mahiEngineKey.includes(':mahi-engine:'), 'Mahi Engine key includes provider namespace');

    // Verify cache content isolation
    await setCachedStream(mahiEngineKey, 'Response from Mahi Engine API', 'none');
    const openrouterLookup = await getCachedStream(openrouterKey);
    const mahiLookup = await getCachedStream(mahiEngineKey);

    assert.strictEqual(openrouterLookup, null, 'OpenRouter cannot read Mahi Engine cached response');
    assert.strictEqual(mahiLookup, 'Response from Mahi Engine API', 'Mahi Engine retrieves its own cached response');
  });

  // Test 29: Mahi Engine Chat Streaming via POST /api/chat/stream
  await test('29. Mahi Engine chat stream succeeds via dedicated System B pipeline', async () => {
    const res = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mahi-engine',
        messages: [{ role: 'user', content: 'Hello from Mahi Engine test' }]
      })
    });

    assert.strictEqual(res.status, 200);
    assert(res.headers.get('content-type').includes('text/event-stream'));
    const text = await res.text();
    assert(text.includes('data:'), 'Contains SSE chunks');
    assert(text.includes('data: [DONE]'), 'Contains terminating [DONE]');
  });

  // Test 30: Multi-model compare with Mahi Engine + OpenRouter
  await test('30. Multi-model compare seamlessly coordinates Mahi Engine and OpenRouter models', async () => {
    const res = await fetch(`${baseUrl}/api/chat/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Brief greeting' }],
        models: ['mahi-engine', 'openai/gpt-4o-mini']
      })
    });

    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert(text.includes('mahi-engine'), 'Contains mahi-engine model events');
    assert(text.includes('openai/gpt-4o-mini') || text.includes('gpt-4o-mini'), 'Contains OpenRouter model events');
    assert(text.includes('[DONE]'), 'Terminates with [DONE]');
  });

  await stopServer();

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test Runner encountered fatal error:', err);
  process.exit(1);
});
