const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
for (let i = 4220; i < 4245; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

