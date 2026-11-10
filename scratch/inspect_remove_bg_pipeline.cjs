const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const pos = html.indexOf('// 4. Remove Background Pipeline');
const endPos = html.indexOf('// 5. Upscale Image Pipeline');
console.log(html.substring(pos, endPos));

