import { config } from '../server/src/config/env.js';

async function testConditioning() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();

  // Let's test with a real public image URL and with base64 data URL
  const testImageUrl = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80';

  console.log('Testing /api/v1/images with black-forest-labs/flux.2-flex and conditioning parameters...');
  const payload1 = {
    model: 'black-forest-labs/flux.2-flex',
    prompt: 'Identical source image preserving original subject anatomy, facial proportions, eye features, lighting, and background composition. Only localized color shift: change the jacket to neon green while maintaining original surface reflections, shadowing, and micro-textures.',
    aspect_ratio: '1:1',
    image: testImageUrl,
    source_image: testImageUrl,
    init_image: testImageUrl,
    image_strength: 0.70,
    strength: 0.70
  };

  try {
    const res = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload1)
    });
    console.log('Status with image conditioning:', res.status);
    const text = await res.text();
    console.log('Response preview:', text.slice(0, 200));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testConditioning().catch(console.error);

