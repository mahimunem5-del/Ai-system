const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

[318, 472, 875, 1455, 2280].forEach(start => {
  console.log(`--- Lines ${start} to ${start + 25} ---`);
  for (let i = start; i < Math.min(start + 25, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
});

