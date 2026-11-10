const { execSync } = require('child_process');
const diff = execSync('git diff index.html', { encoding: 'utf8' });
console.log(diff.slice(Math.max(0, diff.indexOf('updatePlaceholderVisibility') - 300)));

