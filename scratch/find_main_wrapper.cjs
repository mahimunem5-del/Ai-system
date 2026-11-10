const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find where sidebar closes and what main wrapper exists right after
const sidebarIdx = html.indexOf('</aside>');
console.log('After </aside>:');
console.log(html.slice(sidebarIdx, sidebarIdx + 1500));

