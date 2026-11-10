const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('id="image-home-view"');
const recentIdx = html.indexOf('Recent Creations', start);
console.log('recentIdx:', recentIdx);
if (recentIdx !== -1) {
  console.log(html.slice(recentIdx - 150, recentIdx + 1200));
}
