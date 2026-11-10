import { config } from '../server/src/config/env.js';

async function main() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();
  console.log('Testing OpenRouter with key length:', apiKey.length);

  // 1. Key auth check
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('Auth check status:', res.status);
    const keyData = await res.json();
    console.log('Key data:', JSON.stringify(keyData, null, 2));
  } catch (err) {
    console.error('Auth check error:', err.message);
  }

  // 2. Chat completions check (Stage 1 Mahi Engine)
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: 'Say hello in 3 words' }]
      })
    });
    console.log('\nChat completions status (gemini-2.5-flash):', res.status);
    const text = await res.text();
    console.log('Chat completions body:', text.slice(0, 300));
  } catch (err) {
    console.error('Chat completions error:', err.message);
  }

  // 3. Image generation check on /api/v1/images (Standard working image generation handler)
  try {
    const res = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-image-2.5-sunburst',
        prompt: 'A tiny red origami crane on white table'
      })
    });
    console.log('\nImages status (/api/v1/images with gpt-image-2.5-sunburst):', res.status);
    const text = await res.text();
    console.log('Images body:', text.slice(0, 300));
  } catch (err) {
    console.error('Images error:', err.message);
  }

  // 4. Test FLUX.2 Flex on /api/v1/chat/completions
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-flex',
        messages: [{ role: 'user', content: 'A tiny red origami crane' }]
      })
    });
    console.log('\nChat completions status (flux.2-flex):', res.status);
    const text = await res.text();
    console.log('Chat completions body (flux.2-flex):', text.slice(0, 300));
  } catch (err) {
    console.error('FLUX test error:', err.message);
  }
}

main().catch(console.error);

