import OpenAI from 'openai';
import config from '../server/src/config/env.js';

const client = new OpenAI({
  baseURL: config.mahiEngine.baseURL,
  apiKey: config.mahiEngine.apiKey,
  defaultHeaders: { 'x-goog-api-key': config.mahiEngine.apiKey }
});

const redDotBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const ROUTER_PROMPT = `You are an expert Multimodal Intent Router and Visual Delta Prompt Synthesizer modeled after ChatGPT's vision-to-image editing pipeline.
You are given an attached reference image and the user's message in any language (English, Bengali, Banglish, Hindi, etc.).

Analyze the user's intent:
1. CONVERSATIONAL QUERY (is_edit_request = false):
   The user is asking a question about the image, asking for explanation, analysis, details, translation, or conversational discussion.
   Examples:
   - "Eita kisher chobi?" (What picture is this?)
   - "Explain this image"
   - "What is in the picture?"
   - "What color is this?"
   - "How many items are here?"

2. IMAGE EDIT / MODIFICATION REQUEST (is_edit_request = true):
   The user wants to edit, modify, alter, transform, add to, remove from, or generate a modified/new version of the image.
   Examples:
   - "Eitar mathay lal tupi porao" (Put a red hat on its head)
   - "Add sunglasses"
   - "Make background snowy"
   - "Eitake anime banao"
   - "Change color to blue"
   - "Remove the background"

If is_edit_request is true:
- Carefully inspect the reference image: analyze the original subject identity, style (e.g. photo, illustration, 3D render, sketch), lighting, color palette, and composition.
- Synthesize a single, high-detail English visual prompt optimized for FLUX.2 image generation.
- The visual prompt MUST strictly preserve all subject features, identity, artistic style, lighting, and composition from the original image, while seamlessly incorporating the requested modification.
- It must be a complete standalone visual description for the FLUX model.
- Never output instructions or meta-text like 'change the image' or 'here is the prompt'. Only describe the visual scene.

If is_edit_request is false:
- Set visual_prompt to null.

Output strictly valid JSON with this exact schema:
{
  "is_edit_request": boolean,
  "visual_prompt": string | null,
  "reasoning": string
}`;

async function testQuery(text) {
  try {
    const res = await client.chat.completions.create({
      model: config.mahiEngine.model,
      messages: [
        { role: 'system', content: ROUTER_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text },
            { type: 'image_url', image_url: { url: redDotBase64 } }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    console.log('Query:', text);
    console.log('Result:', JSON.parse(res.choices[0].message.content));
    console.log('---');
  } catch (err) {
    console.error('Error on query:', text, err.message);
  }
}

async function run() {
  await testQuery('Eitar mathay lal tupi porao');
  await testQuery('Eita kisher chobi?');
  await testQuery('Add sunglasses to the subject');
  await testQuery('Explain this image in detail');
}
run();
