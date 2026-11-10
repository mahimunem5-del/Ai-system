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

async function checkImageGeneratingModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  const models = data.data || [];
  
  const imageGen = models.filter(m => {
    const mod = m.architecture?.modality || '';
    return mod.endsWith('image') || mod.endsWith('image+text') || mod.includes('->image');
  });

  console.log('Models with image generation output:');
  console.log(JSON.stringify(imageGen.map(m => ({ id: m.id, name: m.name, modality: m.architecture?.modality })), null, 2));
}

checkImageGeneratingModels();

