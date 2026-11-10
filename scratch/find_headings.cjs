const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const pBox = html.indexOf('Pure Ideogram-Style Center Prompt Box');
const next15000 = html.slice(pBox, pBox + 15000);
// Find where prompt box closes:
const endPrompt = next15000.indexOf('<!--');
console.log('pBox index:', pBox);
// Let's search for headings like "Recent", "Community", "Apps", "Templates" etc.
const headings = [];
const regex = /<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi;
let match;
while ((match = regex.exec(next15000)) !== null) {
  headings.push(match[1]);
}
console.log('Headings found after prompt box:', headings);

