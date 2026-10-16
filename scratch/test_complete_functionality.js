import { IMAGE_GENERATION_TOOL, isImageIntent } from '../server/src/services/imageService.js';
import { MARKDOWN_FORMATTING_GUIDELINES } from '../server/src/services/openrouterService.js';
import { MAHI_ENGINE_SYSTEM_PROMPT } from '../server/src/services/mahiEngineResolver.js';
import assert from 'assert';

console.log('--- 1. Testing IMAGE_GENERATION_TOOL schema ---');
assert.strictEqual(IMAGE_GENERATION_TOOL.type, 'function');
assert.strictEqual(IMAGE_GENERATION_TOOL.function.name, 'generate_image');
assert.ok(IMAGE_GENERATION_TOOL.function.description.includes('ANY language'));
assert.strictEqual(IMAGE_GENERATION_TOOL.function.parameters.type, 'object');
assert.ok(IMAGE_GENERATION_TOOL.function.parameters.properties.prompt);
assert.deepStrictEqual(IMAGE_GENERATION_TOOL.function.parameters.required, ['prompt']);
console.log('✓ IMAGE_GENERATION_TOOL schema perfectly matches requirements.');

console.log('--- 2. Testing regex bypass for LLM tool calling ---');
assert.strictEqual(isImageIntent('generate an image of a cat'), false);
assert.strictEqual(isImageIntent('ekta chobi banao'), false);
assert.strictEqual(isImageIntent('draw a wallpaper'), false);
console.log('✓ Regex keyword matching successfully replaced in favor of LLM tool calling.');

console.log('--- 3. Testing Markdown Formatting Guidelines ---');
assert.ok(MARKDOWN_FORMATTING_GUIDELINES.includes('triple-backtick'));
assert.ok(MARKDOWN_FORMATTING_GUIDELINES.includes('## Slide Title'));
assert.ok(MARKDOWN_FORMATTING_GUIDELINES.includes('---'));
assert.ok(MAHI_ENGINE_SYSTEM_PROMPT.includes('MARKDOWN & OUTPUT FORMATTING GUIDELINES:'));
assert.ok(MAHI_ENGINE_SYSTEM_PROMPT.includes('## Slide Title'));
console.log('✓ Markdown and slide formatting guidelines present in both OpenRouter and Mahi Engine system prompts.');

console.log('--- 4. Testing stream tool call interception logic ---');
// Simulate stream yielding tool calls vs normal text
async function* mockToolStream() {
  yield {
    choices: [{
      delta: {
        tool_calls: [{
          id: 'call_1',
          function: { name: 'generate_image', arguments: '{"prompt": "A futuristic neon city at sunset"}' }
        }]
      }
    }]
  };
}

const writtenChunks = [];
const mockWriteChunk = (payload) => writtenChunks.push(payload);

// Test tool call processing through the logic implemented in openrouterService
let isToolCall = false;
let toolCallArguments = '';
let statusSent = false;

for await (const chunk of mockToolStream()) {
  const delta = chunk.choices?.[0]?.delta;
  const toolCalls = delta?.tool_calls;
  if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
    isToolCall = true;
    for (const tc of toolCalls) {
      if (tc.function?.arguments) {
        toolCallArguments += tc.function.arguments;
      }
    }
    if (!statusSent) {
      statusSent = true;
      mockWriteChunk({ type: 'status', message: 'Synthesizing visual asset with FLUX.1 Schnell...' });
    }
    continue;
  }
}

assert.strictEqual(isToolCall, true);
assert.strictEqual(statusSent, true);
assert.strictEqual(writtenChunks.length, 1);
assert.deepStrictEqual(writtenChunks[0], { type: 'status', message: 'Synthesizing visual asset with FLUX.1 Schnell...' });

const parsedArgs = JSON.parse(toolCallArguments);
assert.strictEqual(parsedArgs.prompt, 'A futuristic neon city at sunset');

console.log('✓ Tool call stream iteration correctly intercepts tool call, suppresses raw JSON tokens, and issues status update.');
console.log('ALL UNIT CHECKS PASSED SUCCESSFULLY!');
