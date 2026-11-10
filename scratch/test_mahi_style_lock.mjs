import { config } from '../server/src/config/env.js';

async function testMahiEngineStyleLock() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '');

  const systemInstruction = `You are an expert Inpainting & Diffusion Prompt Engineer.
CRITICAL INSTRUCTION: The user wants to edit the provided image. DO NOT regenerate a new subject or change the medium.
1. STYLE LOCK: Detect the artistic medium (e.g. 3D cartoon render, photorealistic photo, anime illustration). Explicitly specify this style so the model does not alter the genre.
2. COMPOSITION LOCK: Enforce that the subject's pose, facial structure, background elements, lighting, and camera angle remain 100% IDENTICAL to the source image.
3. TARGET DELTA: Translate the user's change into an explicit modification (e.g., 'Keep the exact 3D cartoon chili mascot anatomy, white chef hat, expression, and kitchen counter identical; only recolor the chili body from red to green').
Output ONLY the refined diffusion prompt string.`;

  const sampleSource = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemInstruction },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Make her hair bright emerald green and add a small silver star earring' },
            { type: 'image_url', image_url: { url: sampleSource } }
          ]
        }
      ],
      temperature: 0.4,
      max_tokens: 500
    })
  });

  console.log('Gemini status:', res.status);
  const data = await res.json();
  const refined = data.choices?.[0]?.message?.content;
  console.log('\nRefined Prompt from Mahi Engine:\n', refined);
}

testMahiEngineStyleLock().catch(console.error);

