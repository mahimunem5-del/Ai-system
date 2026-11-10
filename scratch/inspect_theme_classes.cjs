const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('id="image-studio-workspace"');
const rightPanelStart = html.indexOf('id="ideogram-right-panel"');

console.log('--- Workspace container tag ---');
console.log(html.slice(start - 20, start + 300));

console.log('--- Right panel tag and header ---');
console.log(html.slice(rightPanelStart - 20, rightPanelStart + 2500));

