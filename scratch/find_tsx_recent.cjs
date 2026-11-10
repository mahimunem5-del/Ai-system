const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Recent Creations')) {
    console.log('Recent Creations at line:', i + 1);
    console.log(lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 35)).join('\n'));
  }
});

