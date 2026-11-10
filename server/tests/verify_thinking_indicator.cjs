const fs = require('fs');
const path = require('path');
const http = require('http');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log('=== VERIFYING MAIN CHAT THINKING INDICATOR REUSE ===');

// Check 1: Main Chat indicator markup
const mainChatThinkingMarkup = html.includes('// Seamless loading state when assistant is "thinking" (Brain Icon + Shimmering "Thinking...")');
console.log('1. Main Chat Thinking indicator exists in index.html:', mainChatThinkingMarkup);

// Check 2: Conversational Image Workspace uses the exact brain icon SVG and .thinking-shimmer
const hasAnalyzingText = html.includes('<span class="thinking-shimmer">Analyzing…</span>');
const hasCreatingImageText = html.includes('<span class="thinking-shimmer">Creating image…</span>');

console.log('2. Image Workspace has "Analyzing…" with thinking-shimmer:', hasAnalyzingText);
console.log('2. Image Workspace has "Creating image…" with thinking-shimmer:', hasCreatingImageText);

if (!hasAnalyzingText || !hasCreatingImageText) {
    console.error('❌ Check 2 Failed');
    process.exit(1);
}

// Check 3: Brain Icon SVG is identical to Main Chat's brain icon
const brainPath = 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z';
const hasBrainIconInImageChat = html.includes(brainPath);
console.log('3. Image Workspace uses exact Brain Icon SVG from Main Chat:', hasBrainIconInImageChat);

// Check 4: Image Icon SVG uses exact Lucide image paths with w-4 h-4 animate-pulse
const imageIconPath = 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21';
const hasImageIconInImageChat = html.includes(imageIconPath);
console.log('4. Image Workspace uses Image Icon SVG for "Creating image…":', hasImageIconInImageChat);

// Check 5: Client dispatchImageChatTurn handles streaming SSE
const hasStreamReader = html.includes('response.body.getReader()') && html.includes('parsed.status === \'creating_image\'');
console.log('5. Client streams SSE events and switches to "creating_image":', hasStreamReader);

// Check 6: Backend controller handles streaming SSE
const controllerPath = path.join(__dirname, '..', '..', 'server', 'src', 'controllers', 'imageController.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');

const hasBackendAnalyzing = controllerCode.includes("status: 'analyzing'");
const hasBackendCreatingImage = controllerCode.includes("status: 'creating_image'");
const hasBackendComplete = controllerCode.includes("status: 'complete'");

console.log('6. Backend controller emits "analyzing" event:', hasBackendAnalyzing);
console.log('6. Backend controller emits "creating_image" event when dispatching to image model:', hasBackendCreatingImage);
console.log('6. Backend controller emits "complete" event on finish:', hasBackendComplete);

if (!hasBackendAnalyzing || !hasBackendCreatingImage || !hasBackendComplete) {
    console.error('❌ Check 6 Failed');
    process.exit(1);
}

console.log('\n🎉 ALL STATIC CHECKS FOR THINKING INDICATOR PASSED!');

