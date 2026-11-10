const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes("addEventListener('click'") || l.includes('addEventListener("click"')) {
    if (l.includes('window') || l.includes('document')) {
      console.log((idx + 1) + ': ' + l.trim());
    }
  }
});

