const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('function populateEmptyStatePrompts()');
console.log(html.slice(idx, idx + 1000));

