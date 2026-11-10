import { config } from '../server/src/config/env.js';

async function testImagesEndpoint() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();

  const models = [
    'openai/gpt-image-2.5-sunburst',
    'black-forest-labs/flux.2-flex',
    'black-forest-labs/flux.2-pro',
    'bytedance-seed/seedream-5.0-pro'
  ];

  for (const model of models) {
    try {
      console.log(`\nTesting /api/v1/images with model: ${model}`);
      const res = await fetch('https://openrouter.ai/api/v1/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt: 'A sleek minimalist coffee mug'
        })
      });
      console.log(`Status for ${model}:`, res.status);
      const text = await res.text();
      console.log(`Response for ${model}:`, text.slice(0, 150));
    } catch (err) {
      console.error(`Error for ${model}:`, err.message);
    }
  }
}

testImagesEndpoint().catch(console.error);

