const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('title="Generate"') || line.includes('onGenerate') || (line.includes('rounded-full') && line.includes('w-9'))) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

