const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log(html.slice(243217, 244284));
