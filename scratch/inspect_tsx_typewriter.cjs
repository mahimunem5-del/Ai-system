const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
for (let i = 65; i < 115; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

