const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /id="[^"]*project[^"]*"/gi;
let m;
const ids = new Set();
while ((m = regex.exec(html)) !== null) {
  ids.add(m[0]);
}
console.log('Project related IDs:', Array.from(ids).slice(0, 20));

