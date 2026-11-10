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

async function listModels() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await res.json();
    const seedreamModels = (data.data || []).filter(m => 
      m.id.toLowerCase().includes('seedream') || 
      m.name?.toLowerCase().includes('seedream') || 
      m.id.toLowerCase().includes('bytedance')
    );
    console.log('Seedream / ByteDance models in /api/v1/models:');
    console.log(JSON.stringify(seedreamModels.map(m => ({ id: m.id, name: m.name })), null, 2));

    const imageModels = (data.data || []).filter(m => 
      m.architecture?.modality?.includes('image') ||
      m.id.toLowerCase().includes('image') ||
      m.id.toLowerCase().includes('flux') ||
      m.id.toLowerCase().includes('seedream')
    );
    console.log('\nTotal matching image models:', imageModels.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

listModels();

