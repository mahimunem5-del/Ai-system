const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

console.log('--- Lines 565 to 580 ---');
for (let i = 564; i < 580; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('--- Lines 6420 to 6435 ---');
for (let i = 6419; i < 6435; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

