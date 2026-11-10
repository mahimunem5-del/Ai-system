const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sStart = html.indexOf('<aside id="sidebar"');
const sEnd = html.indexOf('</aside>');
const sidebarHtml = html.slice(sStart, sEnd);

const matches = [];
const regex = /class="[^"]*bg-white[^"]*"/g;
let m;
while ((m = regex.exec(sidebarHtml)) !== null) {
  matches.push(m[0]);
}
console.log('bg-white occurrences inside #sidebar:', matches);

