const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
[19400, 19520, 19565, 19680, 19700, 19780].forEach(start => {
  console.log(`--- Lines ${start} to ${start + 20} ---`);
  for (let i = start; i < Math.min(start + 20, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
});

