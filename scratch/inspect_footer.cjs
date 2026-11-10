const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sStart = html.indexOf('<aside id="sidebar"');
const sEnd = html.indexOf('</aside>');
const sidebarHtml = html.slice(sStart, sEnd);

const fIdx = sidebarHtml.indexOf('class="p-3 border-t border-slate-100 mt-auto bg-white"');
console.log(sidebarHtml.slice(fIdx - 50, fIdx + 300));

