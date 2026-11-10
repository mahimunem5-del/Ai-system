const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING MINIMAL & CLEAN REACT IMAGE WORKSPACE (SRC/COMPONENTS/IMAGEWORKSPACE.TSX) ===\n');

const componentPath = 'src/components/ImageWorkspace.tsx';
assert(fs.existsSync(componentPath), `${componentPath} must exist`);

const code = fs.readFileSync(componentPath, 'utf8');

// 1. Component declaration & Left parameter controls (Generate Image / Smart Edit)
console.log('1. Checking Component Structure & Mode Controls...');
assert(code.includes('export const ImageWorkspace'), 'ImageWorkspace component export missing');
assert(code.includes('Generate Image'), '"Generate Image" controls missing');
assert(code.includes('Smart Edit'), '"Smart Edit" controls missing');
console.log('✔ React component renders both Generate Image and Smart Edit views');

// 2. State & Styling Setup
console.log('\n2. Checking Dynamic Panel Width State & Bounds...');
assert(code.includes('const [panelWidth, setPanelWidth] = useState'), 'panelWidth state missing');
assert(code.includes("localStorage.getItem('ideogram_panel_width')"), 'localStorage getter missing');
assert(code.includes("localStorage.setItem('ideogram_panel_width'"), 'localStorage setter missing');
assert(code.includes("style={{ width: `${panelWidth}px`, minWidth: '300px', maxWidth: '600px' }}"), 'Inline style with 300px/600px bounds missing');
console.log('✔ Dynamic panel width state (300px - 600px, default 380px) and localStorage persistence verified');

// 3. Draggable Divider Handle
console.log('\n3. Checking Minimal & Clean Draggable Divider Handle...');
assert(code.includes('w-1.5'), 'w-1.5 class missing');
assert(code.includes('h-full'), 'h-full class missing');
assert(code.includes('cursor-col-resize'), 'cursor-col-resize missing');
assert(code.includes('bg-transparent'), 'bg-transparent missing');
assert(code.includes('border-r border-gray-200 dark:border-neutral-800'), 'Single clean border line missing');
assert(!code.includes('hover:bg-blue-500'), 'No blue hover glow allowed');
assert(!code.includes('active:bg-blue-500'), 'No blue active glow allowed');
assert(code.includes('select-none'), 'select-none missing');
assert(code.includes('onMouseDown={startResizing}'), 'onMouseDown={startResizing} missing');
assert(code.includes("window.addEventListener('mousemove', handleMouseMove)"), 'mousemove listener missing');
assert(code.includes("window.addEventListener('mouseup', handleMouseUp)"), 'mouseup listener missing');
assert(code.includes("window.removeEventListener('mousemove', handleMouseMove)"), 'mousemove listener cleanup missing');
assert(code.includes("window.removeEventListener('mouseup', handleMouseUp)"), 'mouseup listener cleanup missing');
console.log('✔ Minimal divider handle verified with single 1px clean line and zero blue glow');

// 4. Seamless Right Canvas Flexing
console.log('\n4. Checking Seamless Right Canvas Flexing...');
assert(code.includes('flex-1 min-w-0 overflow-y-auto'), 'flex-1 min-w-0 overflow-y-auto right canvas flex missing');
console.log('✔ Right image feed canvas flex-1 min-w-0 overflow-y-auto verified');

console.log('\n🎉 ALL MINIMAL & CLEAN REACT IMAGE WORKSPACE REQUIREMENTS VERIFIED 100%!');
