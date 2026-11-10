const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

for (let i = 1475; i < 1540; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

