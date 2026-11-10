const fs = require('fs');
if (fs.existsSync('package.json')) {
  console.log('package.json:', fs.readFileSync('package.json', 'utf8'));
}
if (fs.existsSync('server/src/index.js')) {
  const serverJs = fs.readFileSync('server/src/index.js', 'utf8');
  console.log('server/src/index.js first 500 chars:', serverJs.slice(0, 500));
}
