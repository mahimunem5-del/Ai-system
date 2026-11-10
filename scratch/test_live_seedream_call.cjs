const fs = require('fs');

function getApiKey() {
  const content = fs.readFileSync('server/.env', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('OPENROUTER_API_KEY=')) {
      return trimmed.replace('OPENROUTER_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
    }
  }
  return process.env.OPENROUTER_API_KEY;
}

const apiKey = getApiKey();

async function testModel(modelName) {
  const payload = {
    model: modelName,
    prompt: 'A cute cat'
  };

  try {
    const res = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log(`Model [${modelName}] Status:`, res.status);
    const text = await res.text();
    console.log(`Model [${modelName}] Response:`, text);
  } catch (err) {
    console.error(`Model [${modelName}] Error:`, err.message);
  }
}

async function run() {
  await testModel('bytedance-seed/seedream-5.0-pro');
  await testModel('bytedance-seed/seedream-5-0-pro');
  await testModel('bytedance-seed/seedream-4.5');
  await testModel('bytedance/seedream-5.0-pro');
}

run();
