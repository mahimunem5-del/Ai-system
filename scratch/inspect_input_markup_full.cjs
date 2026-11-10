const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const idx = html.indexOf('id="image-home-input-wrapper"');
console.log(html.slice(idx - 100, idx + 1200));

