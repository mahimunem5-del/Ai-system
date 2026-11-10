const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const idx = html.indexOf('ideogram-remove-bg-controls');
console.log(html.substring(idx - 150, idx + 100));

