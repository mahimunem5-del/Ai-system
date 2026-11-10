const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const pBox = 203045;
const endView = html.indexOf('</div>', html.indexOf('id="image-workspace-view"'));
// Find image-workspace-view
const wsIndex = html.indexOf('id="image-workspace-view"');
console.log('workspace-view index:', wsIndex);
console.log(html.slice(wsIndex - 4000, wsIndex));

