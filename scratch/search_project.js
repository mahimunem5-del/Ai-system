import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, i) => {
  if (l.includes('project-chat-messages') || l.includes('project-messages')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
