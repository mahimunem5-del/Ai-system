const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('id="image-home-view"');
if (start !== -1) {
  console.log(html.slice(start + 2000, start + 6500));
}

