const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const pEditStart = html.indexOf('id="ideogram-precise-edit-controls"');
console.log('ideogram-precise-edit-controls:', pEditStart);
console.log(html.slice(pEditStart - 300, pEditStart + 600));
