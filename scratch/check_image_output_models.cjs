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

async function checkOutputModalities() {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  const models = data.data || [];
  
  // Find all models with output modalities including image, or architecture.modality includes image->image or text->image
  const imageOutputModels = models.filter(m => {
    const arch = JSON.stringify(m.architecture || {});
    return arch.includes('image') || m.id.includes('flux') || m.id.includes('image') || m.id.includes('midjourney');
  });

  console.log('Image-capable models in OpenRouter models list:');
  const summary = imageOutputModels.map(m => ({
    id: m.id,
    name: m.name,
    modality: m.architecture?.modality
  }));
  console.log(JSON.stringify(summary.slice(0, 30), null, 2));

  // Check specifically for seedream or byte
  const byteModels = models.filter(m => m.id.includes('seed') || m.id.includes('byte'));
  console.log('\nByteDance / Seed models:');
  console.log(JSON.stringify(byteModels.map(m => ({ id: m.id, name: m.name })), null, 2));
}

checkOutputModalities();

