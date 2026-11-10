const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('sidebar') || line.includes('border-r')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

