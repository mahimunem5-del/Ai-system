const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const start = tsx.indexOf("workflowTool === 'remove-background'");
console.log(tsx.substring(start - 50, start + 2500));

