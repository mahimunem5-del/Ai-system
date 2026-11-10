import { config } from '../server/src/config/env.js';

async function testImageInput() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();
  const sample1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const testPayloads = [
    {
      name: 'prompt only',
      body: {
        model: 'black-forest-labs/flux.2-flex',
        prompt: 'A sleek modern coffee cup'
      }
    },
    {
      name: 'with image field',
      body: {
        model: 'black-forest-labs/flux.2-flex',
        prompt: 'A sleek modern coffee cup',
        image: sample1x1
      }
    },
    {
      name: 'with init_image field',
      body: {
        model: 'black-forest-labs/flux.2-flex',
        prompt: 'A sleek modern coffee cup',
        init_image: sample1x1
      }
    }
  ];

  for (const t of testPayloads) {
    try {
      console.log(`\nTesting payload: ${t.name}`);
      const res = await fetch('https://openrouter.ai/api/v1/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(t.body)
      });
      console.log(`Status (${t.name}):`, res.status);
      const text = await res.text();
      console.log(`Body (${t.name}):`, text.slice(0, 150));
    } catch (e) {
      console.error(`Error (${t.name}):`, e.message);
    }
  }
}

testImageInput().catch(console.error);

