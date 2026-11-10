const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('function renderStudioAssetsGallery()');
const end = html.indexOf('function ', start + 100);
const fnHtml = html.slice(start, end);

console.log('renderStudioAssetsGallery length:', fnHtml.length);
console.log(fnHtml.slice(0, 1500));

