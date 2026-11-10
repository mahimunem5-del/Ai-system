const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const pBoxEnd = html.indexOf('id="image-home-generate-btn"');
console.log(html.slice(pBoxEnd, pBoxEnd + 4000));

