import OpenAI from 'openai';
import config from '../src/config/env.js';

const client = new OpenAI({
  baseURL: config.openrouter.baseURL,
  apiKey: config.openrouter.apiKey
});

const redDot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const PROMPT = `You are an AI Intent Classifier and Visual Prompt Architect.
Analyze the user's message and any attached image:
1. Normal Chat / Inquiry (is_image_request = false): questions about the image (e.g. 'Eita kisher chobi?'), conversational queries, coding, etc.
2. Image Creation / Modification (is_image_request = true): user wants to create an image, or modify the attached image (e.g. 'Eitar mathay lal tupi porao', 'add a hat').
If is_image_request is true, analyze visual features and generate a refined English visual prompt for FLUX.
Output strictly JSON: { "is_image_request": boolean, "visual_prompt": string | null, "reasoning": string }`;

async function test(model, query, hasImg) {
  const content = hasImg
    ? [ { type: 'text', text: query }, { type: 'image_url', image_url: { url: redDot } } ]
    : query;

  try {
    const res = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: content }
      ],
      max_tokens: 300
    });
    console.log(model, '| Query:', query);
    console.log('Result:', res.choices[0].message.content.trim());
    console.log('---');
  } catch (e) {
    console.log(model, 'Error:', e.message);
  }
}

async function run() {
  await test('openai/gpt-4o-mini', 'Eitar mathay lal tupi porao', true);
  await test('openai/gpt-4o-mini', 'Eita kisher chobi?', true);
}
run();
