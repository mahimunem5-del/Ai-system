const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

console.log('--- Lines 15 to 40 ---');
for (let i = 14; i < 40; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('--- Lines 860 to 910 ---');
for (let i = 860; i < 910; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

