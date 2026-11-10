const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('id="sidebar"')) {
    console.log((idx + 1) + ': ' + l.trim());
    for (let i = idx; i < idx + 20; i++) {
      console.log('  ' + (i + 1) + ': ' + lines[i]);
    }
  }
});

