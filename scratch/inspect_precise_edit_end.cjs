const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const pEditStart = html.indexOf('id="ideogram-precise-edit-controls"');
const resizerIdx = html.indexOf('id="ideogram-sidebar-resizer"');
console.log(html.slice(pEditStart + 18000, resizerIdx));
