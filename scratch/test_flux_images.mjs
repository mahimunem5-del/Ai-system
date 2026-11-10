import { config } from '../server/src/config/env.js';

async function testFluxImagesParams() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();

  // Test 1: FLUX.2 Flex on /api/v1/images with prompt
  try {
    console.log('Testing /api/v1/images with flux.2-flex and prompt...');
    const res = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-flex',
        prompt: 'A ceramic coffee cup turned neon green, high detail'
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Result keys:', Object.keys(data));
    if (data.data && data.data[0]) {
      console.log('Image data type:', data.data[0].b64_json ? 'b64_json' : data.data[0].url ? 'url' : 'other');
      console.log('Sample data:', JSON.stringify(data.data[0]).slice(0, 100));
    } else {
      console.log('Error/Response:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testFluxImagesParams().catch(console.error);

