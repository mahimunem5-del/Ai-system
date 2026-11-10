const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
console.log('tsx length:', tsx.length);
console.log('has recent creations:', tsx.includes('Recent Creations'));
console.log('has creative-workflows:', tsx.includes('Creative Workflows'));
console.log('has WorkflowTool:', tsx.includes('WorkflowTool'));

