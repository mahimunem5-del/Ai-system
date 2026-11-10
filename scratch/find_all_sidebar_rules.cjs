const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /#sidebar[^{]*\{([^}]+)\}/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log('MATCH:', match[0]);
}

