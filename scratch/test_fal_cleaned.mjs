import fs from 'fs';

const envContent = fs.readFileSync('server/.env', 'utf8');
const match = envContent.match(/FAL_KEY=([^\r\n]+)/);
let falKey = match ? match[1].trim() : '';
if ((falKey.startsWith('"') && falKey.endsWith('"')) || (falKey.startsWith("'") && falKey.endsWith("'"))) {
  falKey = falKey.slice(1, -1);
}
console.log('Cleaned Fal key:', falKey.slice(0, 12));

const testImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
try {
  const res = await fetch('https://fal.run/fal-ai/imageutils/rembg', {
    method: 'POST',
    headers: {
      'Authorization': 'Key ' + falKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_url: testImage })
  });
  console.log('fal.run status:', res.status);
  const data = await res.json();
  console.log('fal.run response data:', data);
} catch (e) {
  console.error('Fetch error:', e);
}

