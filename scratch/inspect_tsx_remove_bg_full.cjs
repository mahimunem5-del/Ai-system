const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const start = tsx.indexOf("workflowTool === 'remove-background'");
const end = tsx.indexOf("workflowTool === 'upscale-image'");
console.log(tsx.substring(start, end));

