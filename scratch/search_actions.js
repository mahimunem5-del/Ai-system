import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, i) => {
  if (l.includes('createMessageActionBar') || l.includes('formatAssistantMarkdown')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
