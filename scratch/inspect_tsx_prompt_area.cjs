const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
for (let i = 265; i < 330; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

