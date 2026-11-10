import { config } from '../server/src/config/env.js';
import { extractImagesFromChatCompletion } from '../server/src/controllers/imageController.js';

async function testCandidatePipeline() {
  const apiKey = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '').trim();
  const refinedPrompt = 'A sleek modern minimal ceramic coffee cup, studio lighting';
  const aspectRatio = '1:1';

  const requestHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': config.openrouter.siteUrl || 'http://localhost:5001',
    'X-Title': 'Mestrio AI'
  };

  const candidates = [
    {
      id: 'black-forest-labs/flux.2-flex',
      name: 'FLUX.2 Flex',
      url: 'https://openrouter.ai/api/v1/images',
      makePayload: () => ({
        model: 'black-forest-labs/flux.2-flex',
        prompt: refinedPrompt,
        aspect_ratio: aspectRatio
      })
    },
    {
      id: 'black-forest-labs/flux.2-pro',
      name: 'FLUX.2 Pro',
      url: 'https://openrouter.ai/api/v1/images',
      makePayload: () => ({
        model: 'black-forest-labs/flux.2-pro',
        prompt: refinedPrompt,
        aspect_ratio: aspectRatio
      })
    },
    {
      id: 'openai/gpt-image-2.5-sunburst',
      name: 'GPT Image 2.5 Sunburst',
      url: 'https://openrouter.ai/api/v1/images',
      makePayload: () => ({
        model: 'openai/gpt-image-2.5-sunburst',
        prompt: refinedPrompt,
        aspect_ratio: aspectRatio
      })
    }
  ];

  for (const candidate of candidates) {
    console.log(`Trying candidate ${candidate.name} at ${candidate.url}...`);
    try {
      const res = await fetch(candidate.url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(candidate.makePayload())
      });

      console.log(`Status for ${candidate.name}:`, res.status);
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (_) {}

      if (res.ok && data) {
        const urls = extractImagesFromChatCompletion(data);
        console.log(`Extracted images count for ${candidate.name}:`, urls.length);
        if (urls.length > 0) {
          console.log(`SUCCESS! First image snippet:`, urls[0].slice(0, 60));
          break;
        }
      } else {
        console.log(`Candidate ${candidate.name} failed:`, text.slice(0, 150));
      }
    } catch (e) {
      console.error(`Error for ${candidate.name}:`, e.message);
    }
  }
}

testCandidatePipeline().catch(console.error);

