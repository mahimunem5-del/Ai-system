const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const mainIdx = html.indexOf('<main class="flex-1 flex flex-col h-full relative min-w-0">');
console.log(html.slice(mainIdx + 2800, mainIdx + 6000));

