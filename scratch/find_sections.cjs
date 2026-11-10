const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const pBox = 203045;
console.log('Total length:', html.length);
console.log(html.slice(pBox + 10000, pBox + 15000));

