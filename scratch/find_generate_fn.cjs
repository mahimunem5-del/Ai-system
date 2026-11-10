const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function generateStudioImages(')) {
    console.log('generateStudioImages found at line:', i + 1);
    console.log(lines.slice(i, i + 50).join('\n'));
  }
});

