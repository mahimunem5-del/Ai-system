import { config } from '../server/src/config/env.js';
import { enhancePreciseEditPromptWithMahiEngine } from '../server/src/controllers/imageController.js';

async function testFullTwoStage() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();
  const sample1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  console.log('Testing Stage 1: Mahi Engine refinement...');
  const refinedPrompt = await enhancePreciseEditPromptWithMahiEngine(
    sample1x1,
    [],
    'Make the background vibrant purple sunset and add a cute cat',
    apiKey,
    'test_stage1_req',
    'Medium'
  );
  console.log('Stage 1 Refined Prompt:', refinedPrompt);

  console.log('\nTesting Stage 2: Synthesis with FLUX.2 Flex on /api/v1/images...');
  const res = await fetch('https://openrouter.ai/api/v1/images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux.2-flex',
      prompt: refinedPrompt
    })
  });

  console.log('Stage 2 Status:', res.status);
  const data = await res.json();
  if (data.data && data.data[0]) {
    const imgData = data.data[0].b64_json || data.data[0].url;
    console.log('Stage 2 SUCCESS! Image received, length:', imgData.length);
  } else {
    console.log('Stage 2 Response:', JSON.stringify(data));
  }
}

testFullTwoStage().catch(console.error);

