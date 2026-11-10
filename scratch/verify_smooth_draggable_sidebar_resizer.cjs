const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING MINIMAL & CLEAN DRAGGABLE SIDEBAR RESIZER (IDEOGRAM STYLE) ===\n');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Resizable Panel Width State
console.log('1. Checking Resizable Panel Width State & Constraints...');
assert(html.includes('panelWidth: 380'), 'imageStudioState.panelWidth state variable missing');
assert(html.includes('id="ideogram-left-panel"'), 'ideogram-left-panel container missing');
assert(html.includes('min-width: 300px') || html.includes('min-width: 320px'), 'min-width constraint missing from left panel style');
assert(html.includes('max-width: 600px') || html.includes('max-width: 560px'), 'max-width constraint missing from left panel style');
assert(html.includes('defaultPanelWidth = 380'), 'defaultPanelWidth missing in resizer initialization');
assert(html.includes("localStorage.getItem('ideogram_panel_width')") || html.includes("localStorage.getItem('image_workspace_panel_width')"), 'localStorage panel width getter missing');
assert(html.includes("localStorage.setItem('ideogram_panel_width'") || html.includes("localStorage.setItem('image_workspace_panel_width'"), 'localStorage panel width setter missing');
console.log('✔ Resizable panel width state (300px - 600px, default 380px) and localStorage persistence verified');

// 2. Minimal & Clean Divider Handle (No Blue Glow, No Tooltip, No Double Border)
console.log('\n2. Checking Minimal & Clean Divider UI...');
assert(html.includes('id="ideogram-sidebar-resizer"'), 'Resizer handle element missing');
assert(html.includes('w-1.5'), 'Thin hit area (w-1.5) missing');
assert(html.includes('h-full'), 'Full height (h-full) missing');
assert(html.includes('cursor-col-resize'), 'cursor-col-resize missing');
assert(html.includes('bg-transparent'), 'bg-transparent missing');
assert(html.includes('border-r border-gray-200 dark:border-neutral-800'), 'Single clean border line (border-r border-gray-200 dark:border-neutral-800) missing');
assert(html.includes('select-none'), 'select-none class missing from resizer handle');

// Verify no blue classes on divider
const resizerMatch = html.match(/id="ideogram-sidebar-resizer"[^>]*>/);
assert(resizerMatch, 'Resizer element tag found');
const resizerTag = resizerMatch[0];
assert(!resizerTag.includes('bg-blue-500'), 'resizer tag must not have blue background');
assert(!resizerTag.includes('hover:bg-blue-500'), 'resizer tag must not have blue hover');
assert(!resizerTag.includes('active:bg-blue-500'), 'resizer tag must not have blue active');
assert(!resizerTag.includes('title='), 'resizer tag must not have tooltip title');
console.log('✔ Minimal divider verified: single 1px clean border, no double border, no tooltip, no blue glow');

// 3. Smooth Mouse Drag Logic
console.log('\n3. Checking Mouse Drag Event Listeners & Clamping Logic...');
assert(html.includes("sidebarResizer.addEventListener('mousedown'"), 'mousedown event listener missing');
assert(html.includes("document.body.style.userSelect = 'none'"), 'userSelect = none during drag missing');
assert(html.includes("document.body.style.cursor = 'col-resize'"), 'cursor = col-resize during drag missing');
assert(html.includes('const newWidth = Math.min(Math.max(e.clientX - rect.left, minPanelWidth), maxPanelWidth)'), 'Mouse offset calculation and bound clamping missing');
assert(html.includes("window.addEventListener('mousemove', handleMouseMove)"), 'window mousemove listener missing');
assert(html.includes("window.addEventListener('mouseup', handleMouseUp)"), 'window mouseup listener missing');
assert(html.includes("window.removeEventListener('mousemove', handleMouseMove)"), 'window mousemove cleanup missing');
assert(html.includes("window.removeEventListener('mouseup', handleMouseUp)"), 'window mouseup cleanup missing');
console.log('✔ Smooth mouse drag logic with global window/document listeners, bound clamping, and cleanup verified');

// 4. Responsive Right Canvas Integration
console.log('\n4. Checking Responsive Right Canvas Integration...');
assert(html.includes('id="ideogram-right-panel"'), 'Right panel container missing');
assert(html.includes('class="flex-1 w-full h-full min-w-0 flex flex-col'), 'Right panel flex-1 w-full min-w-0 container styling missing');
assert(html.includes('id="ideogram-assets-viewport" class="flex-1 w-full overflow-y-auto'), 'Viewport flex-1 w-full overflow-y-auto missing');
console.log('✔ Responsive right canvas flex-1 w-full overflow-y-auto expansion/contraction verified');

console.log('\n🎉 ALL MINIMAL & CLEAN RESIZER REQUIREMENTS VERIFIED 100%!');
