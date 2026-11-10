const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('id="image-home-view"');
if (start !== -1) {
  console.log(html.slice(start, start + 3500));
} else {
  console.log('image-home-view not found');
}

