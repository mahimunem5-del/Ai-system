const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('id="ideogram-empty-state"');
console.log(html.slice(idx - 100, idx + 2000));

