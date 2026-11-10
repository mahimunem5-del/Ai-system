const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const pEditStart = html.indexOf('id="ideogram-precise-edit-controls"');
console.log(html.slice(pEditStart - 200, pEditStart + 300));

