const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('function renderStudioAssetsGallery()');
console.log(html.slice(start + 1500, start + 5000));

