const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const pos = tsx.indexOf('const [workflowTool, setWorkflowTool]');
console.log(tsx.substring(pos, pos + 400));

