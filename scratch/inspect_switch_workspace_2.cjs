const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const swIdx = html.indexOf('function switchWorkspace(');
console.log(html.slice(swIdx + 1500, swIdx + 4000));

