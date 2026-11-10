const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('body {') || line.includes('body,') || line.includes('html {') || line.includes('html.dark body') || line.includes('body.dark')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

