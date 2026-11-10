const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = html.match(/class="[^"]*(?:bg-\[#F8FAFC\]|bg-slate-50|bg-white dark:bg-)[^"]*"/g) || [];
console.log('Sample background classes in index.html:\n', [...new Set(matches)].slice(0, 10));

