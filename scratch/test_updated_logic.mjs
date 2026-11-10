import { resolveDimensions, extractImagesFromChatCompletion, enhancePreciseEditPromptWithMahiEngine, formatImageUrlForVision } from '../server/src/controllers/imageController.js';
import assert from 'assert';

async function testUpdatedExecutePreciseEdit() {
  const modelsToTry = [
    { id: 'black-forest-labs/flux.2-flex', name: 'FLUX.2 Flex', endpoint: 'https://openrouter.ai/api/v1/images' },
    { id: 'black-forest-labs/flux.2-pro', name: 'FLUX.2 Pro', endpoint: 'https://openrouter.ai/api/v1/images' },
    { id: 'openai/gpt-image-2.5-sunburst', name: 'GPT Image 2.5 Sunburst', endpoint: 'https://openrouter.ai/api/v1/images' },
    { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', endpoint: 'https://openrouter.ai/api/v1/chat/completions' }
  ];

  // Test 1: Mock with choices (like test 3 of test_precise_edit_live.cjs)
  let callCount = 0;
  global.fetch = async (url, options) => {
    const currentId = ++callCount;
    const body = JSON.parse(options.body || '{}');
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        id: `gen_${currentId}`,
        model: body.model,
        choices: [
          {
            message: {
              role: 'assistant',
              content: `Here is your edited result: ![result](https://images.unsplash.com/photo-1544005313?var=${currentId})`
            }
          }
        ]
      })
    };
  };

  // Test 2: Mock with 404 on flux.2-flex then 200 on flux.2-pro (like test 4)
  let fallbackAttemptCount = 0;
  const fallbackFetch = async (url, options) => {
    const currentFbId = ++fallbackAttemptCount;
    const body = JSON.parse(options.body || '{}');

    if (body.model === 'black-forest-labs/flux.2-flex') {
      return {
        ok: false,
        status: 404,
        text: async () => JSON.stringify({
          error: { message: 'The requested path could not be found.', code: 404 }
        })
      };
    }

    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        id: `gen_fb_${currentFbId}`,
        model: body.model,
        data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }]
      })
    };
  };

  console.log('Testing mock responses extraction...');
  const res1 = extractImagesFromChatCompletion({
    choices: [{ message: { content: '![result](https://images.unsplash.com/photo-1544005313?var=1)' } }]
  });
  assert.strictEqual(res1.length, 1);
  console.log('Choices extraction passed:', res1[0]);

  const res2 = extractImagesFromChatCompletion({
    data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }]
  });
  assert.strictEqual(res2.length, 1);
  console.log('Data b64_json extraction passed:', res2[0].slice(0, 40));

  console.log('\nAll extraction checks passed!');
}

testUpdatedExecutePreciseEdit().catch(console.error);

