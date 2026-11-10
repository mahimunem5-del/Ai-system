import mahiEngineProvider from '../src/providers/mahiEngineProvider.js';
import { config } from '../src/config/env.js';

const client = mahiEngineProvider.getMahiClient();

const systemPrompt = `You are Mahi Engine (Standard), the flagship internal AI intelligence layer for Mestrio AI's Image Workspace.
Output strictly JSON:
{
  "intent": "IMAGE_GENERATION" | "IMAGE_EDITING" | "IMAGE_VARIATION" | "NORMAL_CONVERSATION" | "IMAGE_DISCUSSION",
  "message": "Conversational reply in user's language",
  "optimized_prompt": "visual English prompt (or null for chat/discussion)",
  "visual_delta": "short edit description or null"
}`;

async function run() {
  const tests = [
    { prompt: 'Create a luxury perfume bottle on a marble pedestal', history: [] },
    { prompt: 'What is the difference between cinematic and realistic photography?', history: [] },
    { prompt: 'Make the lighting warmer and add subtle smoke in the background', history: [
      { role: 'user', content: 'Create a luxury perfume bottle on a marble pedestal' },
      { role: 'assistant', content: 'Crafting your luxury perfume advertisement...', imagePrompt: 'A crystal luxury perfume bottle on a white polished marble pedestal, dramatic studio rim lighting' }
    ]}
  ];

  for (const t of tests) {
    console.log('\n--- Input:', t.prompt);
    const contextMsgs = t.history.map(m => ({
      role: m.role,
      content: m.content + (m.imagePrompt ? ` [Previous Image Prompt: ${m.imagePrompt}]` : '')
    }));

    const res = await client.chat.completions.create({
      model: config.mahiEngine.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...contextMsgs,
        { role: 'user', content: t.prompt }
      ],
      response_format: { type: 'json_object' }
    });

    console.log('Result:', JSON.parse(res.choices[0].message.content));
  }
}

run().catch(console.error);

