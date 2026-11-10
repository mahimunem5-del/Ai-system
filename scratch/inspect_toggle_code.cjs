const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

for (let i = 25040; i < 25135; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

