const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function initStudio') || l.includes('function setupStudio') || l.includes('ideogram-back-to-home-btn')) {
    console.log('Match at line:', i + 1, l.trim());
  }
});

