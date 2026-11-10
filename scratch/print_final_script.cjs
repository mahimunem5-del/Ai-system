const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find streamCurrentPrompt and initImageHomeView
const start = html.indexOf('function updatePlaceholderVisibility()');
const end = html.indexOf('submitHomePrompt()');
console.log(html.slice(start, end));

