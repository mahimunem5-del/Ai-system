const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

console.log('--- Lines 320 to 350 ---');
for (let i = 320; i < 350; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('--- Lines 1460 to 1500 ---');
for (let i = 1460; i < 1500; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

