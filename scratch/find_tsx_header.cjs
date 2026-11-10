const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Generate Image') || l.includes('setView(\'home\')')) {
    console.log('Match at line:', i + 1, l.trim());
  }
});

