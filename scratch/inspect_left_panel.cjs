const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('id="ideogram-left-panel"');
console.log('ideogram-left-panel start:', start);
// Find all sub-panels or forms inside left panel:
const next15000 = html.slice(start, start + 15000);
// Check IDs inside this slice
const ids = [];
const regex = /id="([^"]+)"/g;
let m;
while ((m = regex.exec(next15000)) !== null) {
  ids.push(m[1]);
}
console.log('IDs in ideogram-left-panel:', ids);
