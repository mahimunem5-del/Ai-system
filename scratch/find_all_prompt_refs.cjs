const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('image-home-prompt-input') || line.includes('imageHomePrompt')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

