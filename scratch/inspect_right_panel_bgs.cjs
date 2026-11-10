const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const rightPanelStart = html.indexOf('id="ideogram-right-panel"');
const rightPanelEnd = html.indexOf('</main>', rightPanelStart) + 7;
const rightHtml = html.slice(rightPanelStart, rightPanelEnd);

console.log('--- Checking right panel elements ---');
const bgMatches = rightHtml.match(/bg-[^\s"'>]+/g) || [];
console.log('All bg- classes in right panel:\n', [...new Set(bgMatches)]);

