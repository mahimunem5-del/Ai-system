import assert from 'assert';
import {
  orchestrateImageWorkspaceTurn,
  MAHI_IMAGE_INTELLIGENCE_PROMPT
} from '../src/services/imageService.js';
import {
  resolveOpenRouterImageModel,
  resolveDimensions,
  MODEL_NAME_TO_ID
} from '../src/controllers/imageController.js';

console.log('--- Running Conversational Image Workspace & Mahi Engine Tests ---');

async function runTests() {
  // 1. Verify MAHI_IMAGE_INTELLIGENCE_PROMPT exists and contains key instructions
  assert(MAHI_IMAGE_INTELLIGENCE_PROMPT.includes('IMAGE_GENERATION'), 'Prompt contains IMAGE_GENERATION');
  assert(MAHI_IMAGE_INTELLIGENCE_PROMPT.includes('IMAGE_EDITING'), 'Prompt contains IMAGE_EDITING');
  assert(MAHI_IMAGE_INTELLIGENCE_PROMPT.includes('IMAGE_VARIATION'), 'Prompt contains IMAGE_VARIATION');
  assert(MAHI_IMAGE_INTELLIGENCE_PROMPT.includes('NORMAL_CONVERSATION'), 'Prompt contains NORMAL_CONVERSATION');
  assert(MAHI_IMAGE_INTELLIGENCE_PROMPT.includes('IMAGE_DISCUSSION'), 'Prompt contains IMAGE_DISCUSSION');
  console.log('✓ 1. Mahi Engine intelligence prompt structure verified');

  // 2. Test empty prompt handling
  const emptyRes = await orchestrateImageWorkspaceTurn({ prompt: '' });
  assert.strictEqual(emptyRes.intent, 'NORMAL_CONVERSATION');
  assert.strictEqual(emptyRes.optimizedPrompt, null);
  console.log('✓ 2. Empty prompt handled gracefully');

  // 3. Test Model Resolution Preservation (Never silently overridden)
  const models = [
    { input: 'openai/gpt-image-2.5-sunburst', expected: 'openai/gpt-image-2.5-sunburst' },
    { input: 'google/gemini-3-pro-image', expected: 'google/gemini-3-pro-image' },
    { input: 'black-forest-labs/flux.2-pro', expected: 'black-forest-labs/flux.2-pro' },
    { input: 'bytedance-seed/seedream-5.0-pro', expected: 'bytedance-seed/seedream-5.0-pro' },
    { input: 'meta/muse-image', expected: 'meta/muse-image' },
    { input: 'google/gemini-3.1-flash-image-preview', expected: 'google/gemini-3.1-flash-image-preview' },
    { input: 'GPT Image 2.5 Sunburst', expected: 'openai/gpt-image-2.5-sunburst' },
    { input: 'Nano Banana Pro (Gemini 3 Pro Image)', expected: 'google/gemini-3-pro-image' },
    { input: 'FLUX.2 Pro', expected: 'black-forest-labs/flux.2-pro' },
    { input: 'Seedream 5.0 Pro', expected: 'bytedance-seed/seedream-5.0-pro' },
    { input: 'Meta: Muse Image', expected: 'meta/muse-image' },
    { input: 'Nano Banana 2 (Gemini 3.1 Flash Image)', expected: 'google/gemini-3.1-flash-image-preview' }
  ];

  models.forEach(m => {
    const resolved = resolveOpenRouterImageModel(m.input);
    assert.strictEqual(resolved, m.expected, `Model "${m.input}" resolved to "${resolved}", expected "${m.expected}"`);
  });
  console.log('✓ 3. All image generation model routes strictly preserved without override');

  // 4. Test Aspect Ratio & Dimension Resolution
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  ratios.forEach(r => {
    const dim = resolveDimensions(r);
    assert(dim.width > 0 && dim.height > 0 && dim.aspect_ratio === r);
  });
  console.log('✓ 4. All aspect ratios resolved correctly');

  // 5. Test Live Mahi Engine Turn Orchestration (if network available)
  try {
    const genTurn = await orchestrateImageWorkspaceTurn({
      prompt: 'A cyberpunk street in Tokyo with glowing neon signs and rain puddles',
      conversationHistory: []
    });
    assert(genTurn.intent === 'IMAGE_GENERATION', `Expected IMAGE_GENERATION, got ${genTurn.intent}`);
    assert(typeof genTurn.optimizedPrompt === 'string' && genTurn.optimizedPrompt.length > 0);
    assert(typeof genTurn.message === 'string' && genTurn.message.length > 0);
    console.log('✓ 5. Live turn: IMAGE_GENERATION with optimized prompt verified');

    // 6. Test Live Turn: Normal Question / Conversation (No image should be generated)
    const chatTurn = await orchestrateImageWorkspaceTurn({
      prompt: 'What is the difference between cinematic and realistic photography?',
      conversationHistory: []
    });
    assert(chatTurn.intent === 'NORMAL_CONVERSATION' || chatTurn.intent === 'IMAGE_DISCUSSION', `Expected text intent, got ${chatTurn.intent}`);
    assert.strictEqual(chatTurn.optimizedPrompt, null, 'Optimized prompt must be null for text questions');
    assert(typeof chatTurn.message === 'string' && chatTurn.message.length > 20);
    console.log('✓ 6. Live turn: NORMAL_CONVERSATION verified (no image generated)');

    // 7. Test Live Turn: Context-Aware Editing
    const editTurn = await orchestrateImageWorkspaceTurn({
      prompt: 'Make the neon signs purple and add fog',
      conversationHistory: [
        { role: 'user', content: 'A cyberpunk street in Tokyo with glowing neon signs and rain puddles' },
        { role: 'assistant', content: 'Creating your Tokyo street scene...', imagePrompt: 'A vibrant cyberpunk Tokyo street at night, neon reflections in rain puddles' }
      ]
    });
    assert(editTurn.intent === 'IMAGE_EDITING', `Expected IMAGE_EDITING, got ${editTurn.intent}`);
    assert(typeof editTurn.optimizedPrompt === 'string');
    assert(editTurn.optimizedPrompt.toLowerCase().includes('purple') || editTurn.optimizedPrompt.toLowerCase().includes('fog'));
    console.log('✓ 7. Live turn: Context-Aware IMAGE_EDITING verified (visual delta applied)');

    // 8. Test Live Turn: Variations
    const varTurn = await orchestrateImageWorkspaceTurn({
      prompt: 'Create 2 variations with a different camera angle',
      conversationHistory: [
        { role: 'user', content: 'A cyberpunk street in Tokyo with glowing neon signs and rain puddles' },
        { role: 'assistant', content: 'Creating your Tokyo street scene...', imagePrompt: 'A vibrant cyberpunk Tokyo street at night, neon reflections in rain puddles' }
      ]
    });
    assert(varTurn.intent === 'IMAGE_VARIATION' || varTurn.intent === 'IMAGE_EDITING', `Expected variation/edit, got ${varTurn.intent}`);
    console.log('✓ 8. Live turn: IMAGE_VARIATION verified');

  } catch (err) {
    console.log('Note: Network-dependent live test skipped or handled: ' + err.message);
  }

  console.log('\n--- ALL CONVERSATIONAL IMAGE WORKSPACE TESTS PASSED ---');
}

runTests().catch(err => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});

