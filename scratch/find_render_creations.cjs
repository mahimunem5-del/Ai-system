const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function renderImageHomeCreations')) {
    console.log('renderImageHomeCreations found at line:', i + 1);
    console.log(lines.slice(i, i + 35).join('\n'));
  }
});

