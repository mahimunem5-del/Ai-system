const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sStart = html.indexOf('<aside id="sidebar"');
const sEnd = html.indexOf('</aside>');
const sidebarHtml = html.slice(sStart, sEnd);

const lines = sidebarHtml.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('border-r') || line.includes('border-') || line.includes('shadow')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

