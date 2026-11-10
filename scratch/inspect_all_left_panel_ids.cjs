const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('id="ideogram-left-panel"');
const end = html.indexOf('id="ideogram-sidebar-resizer"');
console.log('Left panel length:', end - start);
const panelSlice = html.slice(start, end);

const idMatches = [];
const regex = /id="([^"]+)"/g;
let m;
while ((m = regex.exec(panelSlice)) !== null) {
  idMatches.push(m[1]);
}
console.log('All IDs in left panel:', idMatches);
