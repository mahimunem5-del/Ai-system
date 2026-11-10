const fs = require('fs');

console.log('--- VERIFYING CREATIVE WORKFLOWS & WORKSPACE TOOL SWITCHER ---');

// 1. Verify index.html
const html = fs.readFileSync('index.html', 'utf8');

const htmlChecks = [
  { name: 'Carousel container', test: html.includes('id="creative-workflows-carousel"') },
  { name: 'Scroll buttons', test: html.includes('id="workflow-scroll-left"') && html.includes('id="workflow-scroll-right"') },
  { name: 'Card 1: generate-image', test: html.includes('data-workflow-tool="generate-image"') },
  { name: 'Card 2: remove-background', test: html.includes('data-workflow-tool="remove-background"') },
  { name: 'Card 3: precise-edit', test: html.includes('data-workflow-tool="precise-edit"') },
  { name: 'Card 4: upscale-image', test: html.includes('data-workflow-tool="upscale-image"') },
  { name: 'Card 5: image-to-image', test: html.includes('data-workflow-tool="image-to-image"') },
  { name: 'Card 6: vector-illustration', test: html.includes('data-workflow-tool="vector-illustration"') },
  { name: 'Workspace tool switcher button', test: html.includes('id="workspace-tool-switcher-btn"') },
  { name: 'Workspace active tool label', test: html.includes('id="workspace-active-tool-label"') },
  { name: 'Workspace tool flyout', test: html.includes('id="workspace-tool-flyout"') },
  { name: 'Workspace tool search input', test: html.includes('id="workspace-tool-search-input"') },
  { name: 'Workspace tool list', test: html.includes('id="workspace-tool-list"') },
  { name: 'Vector mode banner in controls', test: html.includes('id="vector-mode-banner"') },
  { name: 'Remove background controls panel', test: html.includes('id="ideogram-remove-bg-controls"') },
  { name: 'Upscale image controls panel', test: html.includes('id="ideogram-upscale-controls"') },
  { name: 'Image to image controls panel', test: html.includes('id="ideogram-img2img-controls"') },
  { name: 'JS WORKFLOW_TOOLS array', test: html.includes('const WORKFLOW_TOOLS = [') },
  { name: 'JS switchWorkflowTool function', test: html.includes('function switchWorkflowTool(') },
  { name: 'JS initCreativeWorkflows function', test: html.includes('function initCreativeWorkflows()') },
  { name: 'Vector constraint prompt injection', test: html.includes('flat 2D vector graphic, clean sharp SVG lines') }
];

let htmlFailures = 0;
htmlChecks.forEach(c => {
  if (c.test) {
    console.log(`✓ [HTML] ${c.name}`);
  } else {
    console.error(`✗ [HTML] ${c.name}`);
    htmlFailures++;
  }
});

// 2. Verify ImageWorkspace.tsx
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

const tsxChecks = [
  { name: 'WorkflowTool type definition', test: tsx.includes('export type WorkflowTool =') },
  { name: 'WORKFLOW_TOOLS_CONFIG', test: tsx.includes('WORKFLOW_TOOLS_CONFIG') },
  { name: 'Carousel container', test: tsx.includes('id="creative-workflows-carousel"') },
  { name: 'Card 1: generate-image', test: tsx.includes('setWorkflowTool(\'generate-image\')') },
  { name: 'Card 2: remove-background', test: tsx.includes('setWorkflowTool(\'remove-background\')') },
  { name: 'Card 3: precise-edit', test: tsx.includes('setWorkflowTool(\'precise-edit\')') },
  { name: 'Card 4: upscale-image', test: tsx.includes('setWorkflowTool(\'upscale-image\')') },
  { name: 'Card 5: image-to-image', test: tsx.includes('setWorkflowTool(\'image-to-image\')') },
  { name: 'Card 6: vector-illustration', test: tsx.includes('setWorkflowTool(\'vector-illustration\')') },
  { name: 'Dropdown Tool Switcher', test: tsx.includes('id="workspace-tool-switcher-btn"') },
  { name: 'Tool Switcher Flyout & Search', test: tsx.includes('id="workspace-tool-flyout"') && tsx.includes('Search workflows...') },
  { name: 'Remove background controls', test: tsx.includes('id="ideogram-remove-bg-controls"') },
  { name: 'Upscale controls', test: tsx.includes('id="ideogram-upscale-controls"') },
  { name: 'Image to image controls', test: tsx.includes('id="ideogram-img2img-controls"') },
  { name: 'Vector banner and prompt constraint', test: tsx.includes('id="vector-mode-banner"') && tsx.includes('flat 2D vector graphic') }
];

let tsxFailures = 0;
tsxChecks.forEach(c => {
  if (c.test) {
    console.log(`✓ [TSX] ${c.name}`);
  } else {
    console.error(`✗ [TSX] ${c.name}`);
    tsxFailures++;
  }
});

if (htmlFailures === 0 && tsxFailures === 0) {
  console.log('\n🎉 ALL CHECKS PASSED FOR BOTH HTML AND TSX IMPLEMENTATIONS!');
} else {
  console.error(`\nFailed with ${htmlFailures} HTML and ${tsxFailures} TSX failures.`);
  process.exit(1);
}

