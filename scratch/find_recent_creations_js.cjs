const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = [];
const regex = /renderImageHomeCreations|image-home-recent/g;
let m;
while ((m = regex.exec(html)) !== null) {
  const lineNo = html.slice(0, m.index).split('\n').length;
  matches.push({ term: m[0], line: lineNo });
}
console.log(matches);
