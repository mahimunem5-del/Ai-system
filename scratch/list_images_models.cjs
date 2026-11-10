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

async function checkImageModels() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/images/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('Status images/models:', res.status);
    const data = await res.json();
    console.log('Images models count:', data?.data?.length || 0);
    const seedream = (data.data || []).filter(m => 
      m.id?.toLowerCase().includes('seed') ||
      m.id?.toLowerCase().includes('bytedance')
    );
    console.log('Images/models matching seed/bytedance:');
    console.log(JSON.stringify(seedream.map(m => m.id), null, 2));

    // Also check all ids
    console.log('First 20 image models:');
    console.log(JSON.stringify((data.data || []).slice(0, 20).map(m => m.id), null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

checkImageModels();

