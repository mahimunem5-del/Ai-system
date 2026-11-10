const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const lineNumbers = [3421, 9441, 9810, 12000, 17705, 18048, 18155, 18260, 20997, 22728, 25988, 26981, 27847];

lineNumbers.forEach(ln => {
  console.log(`\n--- Line ${ln} ---`);
  for (let i = Math.max(0, ln - 2); i < Math.min(lines.length, ln + 15); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
    if (lines[i].includes('});')) break;
  }
});

