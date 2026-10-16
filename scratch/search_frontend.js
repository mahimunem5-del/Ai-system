import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

console.log('Searching for chat stream and message rendering in index.html...');
lines.forEach((l, i) => {
  if (l.includes('/api/chat') || l.includes('messages-container') || l.includes('project-messages') || l.includes('role === \'assistant\'') || l.includes('role === "assistant"') || l.includes('type === \'image\'') || l.includes("type === 'image'")) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
