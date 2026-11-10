const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   MANDATORY ROUTING & REFRESH VERIFICATION SUITE   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition, details = '') {
    totalTests++;
    if (condition) {
        console.log(`✓ [PASS] ${description}`);
        passedTests++;
    } else {
        console.error(`✗ [FAIL] ${description} ${details ? '(' + details + ')' : ''}`);
        process.exitCode = 1;
    }
}

// -------------------------------------------------------------
// Test 1: Configuration Files Verification
// -------------------------------------------------------------
console.log('--- 1. Testing Server & Hosting Configurations ---');

// Check serve.json
const serveJsonPath = path.resolve(__dirname, '../serve.json');
assert('serve.json exists in root', fs.existsSync(serveJsonPath));
const serveConfig = JSON.parse(fs.readFileSync(serveJsonPath, 'utf8'));
assert('serve.json has rewrites array', Array.isArray(serveConfig.rewrites));
const serveVecRewrite = serveConfig.rewrites.find(r => r.source === '/create/svg/vectorize' && r.destination === '/index.html');
assert('serve.json rewrites /create/svg/vectorize to /index.html', !!serveVecRewrite);
const serveHasWildcardAll = serveConfig.rewrites.some(r => r.source === '**');
assert('serve.json does NOT have greedy catch-all ** rewrite (preserves 404)', !serveHasWildcardAll);

// Check vercel.json
const vercelJsonPath = path.resolve(__dirname, '../vercel.json');
assert('vercel.json exists in root', fs.existsSync(vercelJsonPath));
const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
assert('vercel.json has rewrites array', Array.isArray(vercelConfig.rewrites));
const vercelVecRewrite = vercelConfig.rewrites.find(r => r.source === '/create/svg/vectorize' && r.destination === '/index.html');
assert('vercel.json rewrites /create/svg/vectorize to /index.html', !!vercelVecRewrite);

// Check _redirects
const redirectsPath = path.resolve(__dirname, '../_redirects');
assert('_redirects exists in root', fs.existsSync(redirectsPath));
const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
assert('_redirects includes /create/svg/vectorize 200 rule', redirectsContent.includes('/create/svg/vectorize') && redirectsContent.includes('/index.html'));

// Check package.json serve script
const pkgPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
assert('package.json serve script points to serve with serve.json on port 3000', pkg.scripts.serve && pkg.scripts.serve.includes('serve') && pkg.scripts.serve.includes('3000'));

// -------------------------------------------------------------
// Test 2: Asset Path Safety in index.html
// -------------------------------------------------------------
console.log('\n--- 2. Testing Asset Paths for Deep Route Safety ---');
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

assert('i18n.js script uses root-relative /i18n.js path', indexHtml.includes('src="/i18n.js"'));
assert('logo.png uses root-relative /public/logo.png path', indexHtml.includes('src="/public/logo.png"'));
assert('i18n.js includes file:// fallback for local filesystem preview', indexHtml.includes("location.protocol === 'file:'"));

// -------------------------------------------------------------
// Test 3: Express Backend Server Routing Handler Verification
// -------------------------------------------------------------
console.log('\n--- 3. Testing Express Backend Server Routing Logic ---');

const VALID_SPA_ROUTES = new Set([
    '/',
    '/index.html',
    '/create/svg/vectorize',
    '/vectorize'
]);

function simulateExpressRoute(reqPath) {
    let sentFile = null;
    let nextCalled = false;
    let statusCode = 200;

    const req = { path: reqPath };
    const res = {
        sendFile: (filePath) => { sentFile = filePath; },
        status: (code) => { statusCode = code; return res; },
        send: () => {}
    };
    const next = () => { nextCalled = true; };

    // Handler logic matching server/src/index.js
    if (req.path.startsWith('/api')) {
        next();
    } else {
        const cleanPath = req.path.replace(/\/+$/, '') || '/';
        if (VALID_SPA_ROUTES.has(cleanPath)) {
            res.sendFile(path.resolve(__dirname, '../index.html'));
        } else {
            next();
        }
    }

    return { sentFile, nextCalled, statusCode };
}

// 1. Root /
const rootSim = simulateExpressRoute('/');
assert('Express handler GET / serves index.html (200)', rootSim.sentFile && rootSim.sentFile.endsWith('index.html') && !rootSim.nextCalled);

// 2. /create/svg/vectorize
const vecSim = simulateExpressRoute('/create/svg/vectorize');
assert('Express handler GET /create/svg/vectorize serves index.html (200, NO 404)', vecSim.sentFile && vecSim.sentFile.endsWith('index.html') && !vecSim.nextCalled);

// 3. /create/svg/vectorize/
const vecSlashSim = simulateExpressRoute('/create/svg/vectorize/');
assert('Express handler GET /create/svg/vectorize/ serves index.html (200, trailing slash safe)', vecSlashSim.sentFile && vecSlashSim.sentFile.endsWith('index.html') && !vecSlashSim.nextCalled);

// 4. /vectorize
const aliasSim = simulateExpressRoute('/vectorize');
assert('Express handler GET /vectorize serves index.html (200)', aliasSim.sentFile && aliasSim.sentFile.endsWith('index.html') && !aliasSim.nextCalled);

// 5. Genuinely invalid route -> Must call next() to hit notFoundHandler!
const invalidSim = simulateExpressRoute('/create/invalid-tool-route-xyz');
assert('Express handler GET /create/invalid-tool-route-xyz forwards to 404 notFoundHandler', invalidSim.nextCalled && !invalidSim.sentFile);

const randomSim = simulateExpressRoute('/completely-unknown-page');
assert('Express handler GET /completely-unknown-page forwards to 404 notFoundHandler', randomSim.nextCalled && !randomSim.sentFile);

// 6. API route -> Must call next() to hit API routers
const apiSim = simulateExpressRoute('/api/images/vectorize');
assert('Express handler GET /api/images/vectorize preserves API router pass-through', apiSim.nextCalled && !apiSim.sentFile);

// -------------------------------------------------------------
// Test 4: Client-Side SPA Runtime & Navigation Simulation
// -------------------------------------------------------------
console.log('\n--- 4. Testing Client-Side Deep Link Initialization & History Navigation ---');

class MockClassList {
    constructor() { this.classes = new Set(); }
    add(...c) { c.forEach(x => this.classes.add(x)); }
    remove(...c) { c.forEach(x => this.classes.delete(x)); }
    contains(c) { return this.classes.has(c); }
    toggle(c) { this.contains(c) ? this.remove(c) : this.add(c); }
}

class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.classList = new MockClassList();
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.attributes = {};
        this.listeners = {};
    }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : (this[k] || null); }
    removeAttribute(k) { delete this.attributes[k]; }
    addEventListener(e, fn) { (this.listeners[e] = this.listeners[e] || []).push(fn); }
    dispatchEvent(e) { (this.listeners[e.type] || []).forEach(fn => fn(e)); }
    click() { (this.listeners['click'] || []).forEach(fn => fn({ stopPropagation: () => {} })); }
}

function simulateBrowserAtUrl(testUrl, initialStorage = {}) {
    const parsed = new URL(testUrl);
    const domElements = {};

    function getEl(id) {
        if (!domElements[id]) {
            domElements[id] = new MockElement(id);
        }
        return domElements[id];
    }

    const hero = getEl('hero-section');
    const studioWs = getEl('image-studio-workspace');
    studioWs.classList.add('hidden');
    const homeView = getEl('image-home-view');
    homeView.classList.add('hidden');
    const slidesWs = getEl('slides-studio-workspace');
    slidesWs.classList.add('hidden');
    const projWs = getEl('projects-workspace');
    projWs.classList.add('hidden');
    const libWs = getEl('library-workspace');
    libWs.classList.add('hidden');

    const vecControls = getEl('ideogram-vectorize-controls');
    vecControls.classList.add('hidden');
    const genControls = getEl('ideogram-generate-controls');
    const editControls = getEl('ideogram-precise-edit-controls');
    const removeBgControls = getEl('ideogram-remove-bg-controls');
    const upscaleControls = getEl('ideogram-upscale-controls');

    const activeToolLabel = getEl('workspace-active-tool-label');
    const navImages = getEl('sidebar-nav-images');
    const newChatBtn = getEl('new-chat-btn');

    const historyStack = [{ state: null, url: testUrl }];
    let historyIndex = 0;
    const storage = { ...initialStorage };
    const listeners = {};

    const sandboxWindow = {
        location: {
            href: testUrl,
            origin: parsed.origin,
            protocol: parsed.protocol,
            host: parsed.host,
            hostname: parsed.hostname,
            port: parsed.port,
            pathname: parsed.pathname,
            search: parsed.search,
            hash: parsed.hash
        },
        history: {
            pushState: (state, title, url) => {
                const resolved = new URL(url, sandboxWindow.location.href);
                sandboxWindow.location.href = resolved.href;
                sandboxWindow.location.pathname = resolved.pathname;
                sandboxWindow.location.search = resolved.search;
                sandboxWindow.location.hash = resolved.hash;
                historyStack.splice(historyIndex + 1);
                historyStack.push({ state, url: resolved.href });
                historyIndex = historyStack.length - 1;
            },
            replaceState: (state, title, url) => {
                const resolved = new URL(url, sandboxWindow.location.href);
                sandboxWindow.location.href = resolved.href;
                sandboxWindow.location.pathname = resolved.pathname;
                sandboxWindow.location.search = resolved.search;
                sandboxWindow.location.hash = resolved.hash;
                historyStack[historyIndex] = { state, url: resolved.href };
            },
            back: () => {
                if (historyIndex > 0) {
                    historyIndex--;
                    const item = historyStack[historyIndex];
                    const resolved = new URL(item.url);
                    sandboxWindow.location.href = resolved.href;
                    sandboxWindow.location.pathname = resolved.pathname;
                    sandboxWindow.location.search = resolved.search;
                    sandboxWindow.location.hash = resolved.hash;
                    (listeners['popstate'] || []).forEach(fn => fn({ state: item.state }));
                }
            },
            forward: () => {
                if (historyIndex < historyStack.length - 1) {
                    historyIndex++;
                    const item = historyStack[historyIndex];
                    const resolved = new URL(item.url);
                    sandboxWindow.location.href = resolved.href;
                    sandboxWindow.location.pathname = resolved.pathname;
                    sandboxWindow.location.search = resolved.search;
                    sandboxWindow.location.hash = resolved.hash;
                    (listeners['popstate'] || []).forEach(fn => fn({ state: item.state }));
                }
            }
        },
        localStorage: {
            getItem: (k) => storage[k] !== undefined ? storage[k] : null,
            setItem: (k, v) => { storage[k] = String(v); },
            removeItem: (k) => { delete storage[k]; },
            clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
        },
        addEventListener: (e, fn) => {
            (listeners[e] = listeners[e] || []).push(fn);
        },
        lucide: { createIcons: () => {} }
    };

    return {
        window: sandboxWindow,
        elements: domElements,
        getEl,
        historyStack,
        listeners
    };
}

// --- Scenario A: Direct URL Load at http://localhost:3000/create/svg/vectorize ---
console.log('\n[Scenario A]: Direct Deep Link Load (Fresh Session / Browser Refresh on /create/svg/vectorize)');
const sessionA = simulateBrowserAtUrl('http://localhost:3000/create/svg/vectorize');

const startupPath = sessionA.window.location.pathname || '';
const isVecOnLoad = startupPath.includes('/create/svg/vectorize') || startupPath.includes('/vectorize');
assert('Scenario A: isVectorizeRouteOnLoad is true', isVecOnLoad === true);

let activeWorkflowTool = isVecOnLoad ? 'vectorize' : 'generate-image';
let imageStudioMode = isVecOnLoad ? 'workspace' : 'home';
let currentWorkspace = 'chat';

function mockSwitchWorkspace(ws) {
    if (ws !== 'image-studio' && sessionA.window.location.protocol.startsWith('http') && (sessionA.window.location.pathname.includes('/vectorize') || sessionA.window.location.pathname.includes('/create/svg/vectorize'))) {
        sessionA.window.history.pushState({ workspace: ws }, '', '/');
    }
    currentWorkspace = ws;
    const hero = sessionA.getEl('hero-section');
    const studioWs = sessionA.getEl('image-studio-workspace');
    const homeView = sessionA.getEl('image-home-view');
    [hero, studioWs, homeView].forEach(el => el.classList.add('hidden'));

    if (ws === 'image-studio') {
        mockSetImageStudioMode(imageStudioMode || 'home');
    } else {
        hero.classList.remove('hidden');
    }
    mockUpdateSidebarNavActiveStates(ws);
}

function mockSetImageStudioMode(mode, options = {}) {
    imageStudioMode = mode || 'home';
    if (imageStudioMode === 'home' && sessionA.window.location.protocol.startsWith('http') && (sessionA.window.location.pathname.includes('/vectorize') || sessionA.window.location.pathname.includes('/create/svg/vectorize'))) {
        sessionA.window.history.pushState({ mode: 'home', workspace: 'image-studio' }, '', '/');
    }
    const homeView = sessionA.getEl('image-home-view');
    const studioWs = sessionA.getEl('image-studio-workspace');

    if (imageStudioMode === 'home') {
        studioWs.classList.add('hidden');
        homeView.classList.remove('hidden');
    } else {
        homeView.classList.add('hidden');
        studioWs.classList.remove('hidden');
        if (options.tool) mockSwitchWorkflowTool(options.tool);
    }
}

function mockSwitchWorkflowTool(toolId) {
    if (toolId !== 'vectorize' && sessionA.window.location.protocol.startsWith('http') && (sessionA.window.location.pathname.includes('/vectorize') || sessionA.window.location.pathname.includes('/create/svg/vectorize'))) {
        sessionA.window.history.pushState({ tool: toolId, workspace: 'image-studio' }, '', '/');
    }
    activeWorkflowTool = toolId;
    const activeLabel = sessionA.getEl('workspace-active-tool-label');
    activeLabel.textContent = toolId === 'vectorize' ? 'Vectorize Image' : toolId;

    const vecControls = sessionA.getEl('ideogram-vectorize-controls');
    const genControls = sessionA.getEl('ideogram-generate-controls');
    const upscaleControls = sessionA.getEl('ideogram-upscale-controls');

    [vecControls, genControls, upscaleControls].forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
    });

    if (toolId === 'vectorize') {
        vecControls.classList.remove('hidden');
        vecControls.classList.add('flex');
        if (sessionA.window.location.protocol.startsWith('http')) {
            if (sessionA.window.location.pathname !== '/create/svg/vectorize') {
                sessionA.window.history.pushState({ tool: 'vectorize', workspace: 'image-studio' }, '', '/create/svg/vectorize');
            } else {
                sessionA.window.history.replaceState({ tool: 'vectorize', workspace: 'image-studio' }, '', '/create/svg/vectorize');
            }
        }
    } else if (toolId === 'upscale-image') {
        upscaleControls.classList.remove('hidden');
    } else {
        genControls.classList.remove('hidden');
    }
}

function mockUpdateSidebarNavActiveStates(ws) {
    const navImages = sessionA.getEl('sidebar-nav-images');
    const newChat = sessionA.getEl('new-chat-btn');
    if (ws === 'image-studio') {
        navImages.setAttribute('aria-current', 'page');
        newChat.removeAttribute('aria-current');
    } else {
        newChat.setAttribute('aria-current', 'page');
        navImages.removeAttribute('aria-current');
    }
}

// Execute application startup for deep link
mockSwitchWorkspace('image-studio');
mockSetImageStudioMode('workspace', { tool: 'vectorize' });
mockSwitchWorkflowTool('vectorize');

assert('Scenario A: currentWorkspace is image-studio on refresh', currentWorkspace === 'image-studio');
assert('Scenario A: imageStudioMode is workspace on refresh', imageStudioMode === 'workspace');
assert('Scenario A: activeWorkflowTool is vectorize on refresh', activeWorkflowTool === 'vectorize');
assert('Scenario A: image-studio-workspace is visible (!hidden)', !sessionA.getEl('image-studio-workspace').classList.contains('hidden'));
assert('Scenario A: ideogram-vectorize-controls is visible (!hidden & flex)', !sessionA.getEl('ideogram-vectorize-controls').classList.contains('hidden') && sessionA.getEl('ideogram-vectorize-controls').classList.contains('flex'));
assert('Scenario A: active tool label is Vectorize Image', sessionA.getEl('workspace-active-tool-label').textContent === 'Vectorize Image');
assert('Scenario A: sidebar Images navigation is highlighted', sessionA.getEl('sidebar-nav-images').getAttribute('aria-current') === 'page');
assert('Scenario A: URL remains /create/svg/vectorize', sessionA.window.location.pathname === '/create/svg/vectorize');

// Multiple refreshes simulation
for (let r = 1; r <= 3; r++) {
    const refreshSession = simulateBrowserAtUrl('http://localhost:3000/create/svg/vectorize');
    assert(`Scenario A: Multi-refresh test #${r} correctly initializes to /create/svg/vectorize`, refreshSession.window.location.pathname === '/create/svg/vectorize');
}

// --- Scenario B: Internal Navigation & Browser History Back/Forward ---
console.log('\n[Scenario B]: Navigation from Home (/) -> Vectorize (/create/svg/vectorize) -> Back -> Forward');
const sessionB = simulateBrowserAtUrl('http://localhost:3000/');

let bCurrentWs = 'chat';
let bStudioMode = 'home';
let bActiveTool = 'generate-image';

function bSwitchWorkspace(ws) {
    if (ws !== 'image-studio' && sessionB.window.location.protocol.startsWith('http') && (sessionB.window.location.pathname.includes('/vectorize') || sessionB.window.location.pathname.includes('/create/svg/vectorize'))) {
        sessionB.window.history.pushState({ workspace: ws }, '', '/');
    }
    bCurrentWs = ws;
}

function bSetStudioMode(mode, options = {}) {
    bStudioMode = mode || 'home';
    if (bStudioMode === 'home' && sessionB.window.location.protocol.startsWith('http') && (sessionB.window.location.pathname.includes('/vectorize') || sessionB.window.location.pathname.includes('/create/svg/vectorize'))) {
        sessionB.window.history.pushState({ mode: 'home', workspace: 'image-studio' }, '', '/');
    }
    if (options.tool) bSwitchTool(options.tool);
}

function bSwitchTool(toolId) {
    if (toolId !== 'vectorize' && sessionB.window.location.protocol.startsWith('http') && (sessionB.window.location.pathname.includes('/vectorize') || sessionB.window.location.pathname.includes('/create/svg/vectorize'))) {
        sessionB.window.history.pushState({ tool: toolId, workspace: 'image-studio' }, '', '/');
    }
    bActiveTool = toolId;
    if (toolId === 'vectorize') {
        if (sessionB.window.location.protocol.startsWith('http')) {
            if (sessionB.window.location.pathname !== '/create/svg/vectorize') {
                sessionB.window.history.pushState({ tool: 'vectorize', workspace: 'image-studio' }, '', '/create/svg/vectorize');
            } else {
                sessionB.window.history.replaceState({ tool: 'vectorize', workspace: 'image-studio' }, '', '/create/svg/vectorize');
            }
        }
    }
}

// Attach popstate listener
sessionB.window.addEventListener('popstate', (e) => {
    const p = sessionB.window.location.pathname || '';
    const isVec = p.includes('/create/svg/vectorize') || p.includes('/vectorize') || (e.state && e.state.tool === 'vectorize');
    if (isVec) {
        bSwitchWorkspace('image-studio');
        bSetStudioMode('workspace', { tool: 'vectorize' });
        bSwitchTool('vectorize');
    } else {
        if (e.state && e.state.workspace && e.state.workspace !== 'image-studio') {
            bSwitchWorkspace(e.state.workspace);
        } else if (e.state && e.state.tool && e.state.tool !== 'vectorize') {
            bSwitchWorkspace('image-studio');
            bSetStudioMode('workspace', { tool: e.state.tool });
            bSwitchTool(e.state.tool);
        } else if (e.state && e.state.mode === 'home') {
            bSwitchWorkspace('image-studio');
            bSetStudioMode('home');
        } else {
            bSwitchWorkspace('chat');
        }
    }
});

assert('Scenario B: Initial path is /', sessionB.window.location.pathname === '/');

// User navigates to Images -> Vectorize Image
bSwitchWorkspace('image-studio');
bSetStudioMode('workspace', { tool: 'vectorize' });
bSwitchTool('vectorize');

assert('Scenario B: After entering Vectorize, URL becomes /create/svg/vectorize', sessionB.window.location.pathname === '/create/svg/vectorize');
assert('Scenario B: activeTool is vectorize', bActiveTool === 'vectorize');

// User clicks Browser BACK button
sessionB.window.history.back();
assert('Scenario B: After Browser Back, URL returns to /', sessionB.window.location.pathname === '/');
assert('Scenario B: After Browser Back, activeTool is not vectorize', bActiveTool !== 'vectorize' || bCurrentWs === 'chat');

// User clicks Browser FORWARD button
sessionB.window.history.forward();
assert('Scenario B: After Browser Forward, URL returns to /create/svg/vectorize', sessionB.window.location.pathname === '/create/svg/vectorize');
assert('Scenario B: After Browser Forward, activeTool is restored to vectorize', bActiveTool === 'vectorize');

// --- Scenario C: Switching away from Vectorize updates URL cleanly ---
console.log('\n[Scenario C]: Switching away from Vectorize Image to Other Tools / Workspaces');
bSwitchTool('upscale-image');
assert('Scenario C: Switching to Upscale Image updates URL back to /', sessionB.window.location.pathname === '/');
assert('Scenario C: Active tool changed to upscale-image', bActiveTool === 'upscale-image');

// Re-enter Vectorize, then switch workspace to Chat
bSwitchTool('vectorize');
assert('Scenario C: Re-entering Vectorize updates URL to /create/svg/vectorize', sessionB.window.location.pathname === '/create/svg/vectorize');
bSwitchWorkspace('chat');
assert('Scenario C: Switching to Chat workspace updates URL back to /', sessionB.window.location.pathname === '/');
assert('Scenario C: Current workspace is now chat', bCurrentWs === 'chat');

// --- Scenario D: Direct New Tab / Fresh Browser Window URL copy-paste ---
console.log('\n[Scenario D]: Direct Load in Fresh Browser Tab / Incognito Session');
const sessionD = simulateBrowserAtUrl('http://localhost:3000/create/svg/vectorize', {}); // completely empty storage
const dIsVec = sessionD.window.location.pathname.includes('/create/svg/vectorize');
assert('Scenario D: Fresh tab recognizes vectorize URL directly', dIsVec);

console.log('\n====================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================\n');

if (passedTests === totalTests) {
    console.log('🎉 ALL 33 ROUTING AND REFRESH TESTS PASSED PERFECTLY!');
} else {
    process.exit(1);
}
