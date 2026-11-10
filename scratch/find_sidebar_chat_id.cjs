const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sStart = html.indexOf('<aside id="sidebar"');
const sEnd = html.indexOf('</aside>');
const sidebarHtml = html.slice(sStart, sEnd);

const regex = /id="[^"]*chat[^"]*"/gi;
let m;
const ids = new Set();
while ((m = regex.exec(sidebarHtml)) !== null) {
  ids.add(m[0]);
}
console.log('Sidebar chat IDs:', Array.from(ids));

