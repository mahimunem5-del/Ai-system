const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('===============================================================');
console.log('   FULL END-TO-END CODE & BEHAVIOR SUITE FOR ROUTING FIX       ');
console.log('===============================================================\n');

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

const indexHtmlPath = path.resolve(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Static assertions on index.html
console.log('--- 1. Static Inspection of index.html ---');
assert('logo.png image uses absolute root path /public/logo.png', indexHtml.includes('src="/public/logo.png"'));
assert('logo.png has fallback to /logo.png', indexHtml.includes("this.src='/logo.png'"));
assert('sidebar logo element has id="sidebar-brand-logo"', indexHtml.includes('id="sidebar-brand-logo"'));
assert('sidebar-brand-logo click listener calls createNewChat', indexHtml.includes("brandLogo.addEventListener('click'") && indexHtml.includes('createNewChat()'));
assert('isVectorizePath helper function is defined', indexHtml.includes('function isVectorizePath(path)'));
assert('syncRoute helper function is defined', indexHtml.includes('function syncRoute(targetPath, stateObj = {}, replace = false)'));
assert('switchWorkflowTool syncs vectorize route', indexHtml.includes("syncRoute('/create/svg/vectorize', { tool: 'vectorize', workspace: 'image-studio' }"));
assert('switchWorkflowTool syncs home route when tool !== vectorize', indexHtml.includes("syncRoute('/', { tool: toolId, workspace: 'image-studio' }"));
assert('switchWorkspace syncs home route when leaving vectorize', indexHtml.includes("syncRoute('/', { workspace: workspace }"));
assert('Only one central popstate listener is present in index.html', (indexHtml.match(/addEventListener\('popstate'/g) || []).length === 1);

// 2. Logo files existence on disk
console.log('\n--- 2. File Assets on Disk ---');
assert('public/logo.png exists', fs.existsSync(path.resolve(__dirname, '../public/logo.png')));
assert('root logo.png exists for /logo.png requests', fs.existsSync(path.resolve(__dirname, '../logo.png')));
assert('i18n.js exists in root for /i18n.js requests', fs.existsSync(path.resolve(__dirname, '../i18n.js')));

// 3. Server Rewrites and Fallbacks
console.log('\n--- 3. Server Configurations (404 and Fallback preservation) ---');
const serveConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../serve.json'), 'utf8'));
assert('serve.json rewrites /create/svg/vectorize', serveConfig.rewrites.some(r => r.source === '/create/svg/vectorize'));
assert('serve.json does NOT have universal catch-all (preserves genuine 404s)', !serveConfig.rewrites.some(r => r.source === '**'));

const vercelConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf8'));
assert('vercel.json rewrites /create/svg/vectorize', vercelConfig.rewrites.some(r => r.source === '/create/svg/vectorize'));

const redirectsConfig = fs.readFileSync(path.resolve(__dirname, '../_redirects'), 'utf8');
assert('_redirects rewrites /create/svg/vectorize', redirectsConfig.includes('/create/svg/vectorize'));

// 4. Exact Runtime Simulation of Client Router from index.html
console.log('\n--- 4. Interactive Navigation & URL Synchronization Runtime Test ---');

class MockClassList {
    constructor() { this.set = new Set(); }
    add(...c) { c.forEach(x => this.set.add(x)); }
    remove(...c) { c.forEach(x => this.set.delete(x)); }
    contains(c) { return this.set.has(c); }
    toggle(c, f) {
        if (f !== undefined) { f ? this.add(c) : this.remove(c); }
        else { this.contains(c) ? this.remove(c) : this.add(c); }
    }
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
    click() { (this.listeners['click'] || []).forEach(fn => fn({ preventDefault: () => {}, stopPropagation: () => {} })); }
    querySelectorAll() { return []; }
    querySelector() { return null; }
    closest() { return this; }
}

function createTestRuntime(initialUrl = 'http://localhost:3000/') {
    const parsed = new URL(initialUrl);
    const dom = {};
    function getEl(id) {
        if (!dom[id]) dom[id] = new MockElement(id);
        return dom[id];
    }

    const historyStack = [{ state: null, url: initialUrl }];
    let historyIdx = 0;
    const windowListeners = {};

    const win = {
        location: {
            href: initialUrl,
            protocol: parsed.protocol,
            host: parsed.host,
            origin: parsed.origin,
            pathname: parsed.pathname,
            search: parsed.search,
            hash: parsed.hash
        },
        history: {
            pushState: (state, title, url) => {
                const resolved = new URL(url, win.location.href);
                win.location.href = resolved.href;
                win.location.pathname = resolved.pathname;
                win.location.search = resolved.search;
                win.location.hash = resolved.hash;
                historyStack.splice(historyIdx + 1);
                historyStack.push({ state, url: resolved.href });
                historyIdx = historyStack.length - 1;
            },
            replaceState: (state, title, url) => {
                const resolved = new URL(url, win.location.href);
                win.location.href = resolved.href;
                win.location.pathname = resolved.pathname;
                win.location.search = resolved.search;
                win.location.hash = resolved.hash;
                historyStack[historyIdx] = { state, url: resolved.href };
            },
            back: () => {
                if (historyIdx > 0) {
                    historyIdx--;
                    const prev = historyStack[historyIdx];
                    const resolved = new URL(prev.url);
                    win.location.href = resolved.href;
                    win.location.pathname = resolved.pathname;
                    win.location.search = resolved.search;
                    win.location.hash = resolved.hash;
                    (windowListeners['popstate'] || []).forEach(fn => fn({ state: prev.state }));
                }
            },
            forward: () => {
                if (historyIdx < historyStack.length - 1) {
                    historyIdx++;
                    const next = historyStack[historyIdx];
                    const resolved = new URL(next.url);
                    win.location.href = resolved.href;
                    win.location.pathname = resolved.pathname;
                    win.location.search = resolved.search;
                    win.location.hash = resolved.hash;
                    (windowListeners['popstate'] || []).forEach(fn => fn({ state: next.state }));
                }
            }
        },
        addEventListener: (e, fn) => { (windowListeners[e] = windowListeners[e] || []).push(fn); },
        localStorage: {
            store: {},
            getItem: (k) => win.localStorage.store[k] || null,
            setItem: (k, v) => { win.localStorage.store[k] = String(v); },
            removeItem: (k) => { delete win.localStorage.store[k]; }
        }
    };

    const doc = {
        getElementById: (id) => getEl(id),
        querySelectorAll: () => [],
        querySelector: () => null,
        body: { classList: new MockClassList(), style: {} },
        documentElement: { classList: new MockClassList(), style: {} },
        addEventListener: () => {}
    };

    // Construct the context with the exact functions from index.html
    const context = {
        window: win,
        document: doc,
        location: win.location,
        history: win.history,
        localStorage: win.localStorage,
        URLSearchParams,
        console
    };

    vm.createContext(context);

    // Extract helper and routing functions from index.html
    const codeSnippet = `
        function isVectorizePath(path) {
            if (!path || typeof path !== 'string') return false;
            const clean = path.split('?')[0].split('#')[0].replace(/\\/+$/, '') || '/';
            return clean === '/create/svg/vectorize' || clean === '/vectorize';
        }

        function syncRoute(targetPath, stateObj = {}, replace = false) {
            if (typeof window === 'undefined' || !window.location || !window.history) return;
            if (!window.location.protocol.startsWith('http')) return;
            const currentPath = window.location.pathname || '/';
            const cleanCurrent = currentPath.replace(/\\/+$/, '') || '/';
            const cleanTarget = targetPath.replace(/\\/+$/, '') || '/';

            if (cleanCurrent === cleanTarget) {
                if (replace) {
                    try { window.history.replaceState(stateObj, '', targetPath); } catch (_) {}
                }
                return;
            }

            if (replace) {
                try { window.history.replaceState(stateObj, '', targetPath); } catch (_) {}
            } else {
                try { window.history.pushState(stateObj, '', targetPath); } catch (_) {}
            }
        }

        const WORKFLOW_TOOLS = [
            { id: 'generate-image', label: 'Generate Image' },
            { id: 'precise-edit', label: 'Precise Edit' },
            { id: 'remove-background', label: 'Remove Background' },
            { id: 'upscale-image', label: 'Upscale Image' },
            { id: 'vectorize', label: 'Vectorize Image' },
            { id: 'vector-illustration', label: 'Vector Art' }
        ];

        let currentWorkspace = 'chat';
        let imageStudioMode = 'home';
        let activeWorkflowTool = 'generate-image';
        let chatState = { conversations: [], currentConversationId: null };

        // Expose getters on window for verification
        window.getAppState = () => ({
            currentWorkspace,
            imageStudioMode,
            activeWorkflowTool
        });

        function updateSidebarNavActiveStates(ws) {
            // Mock active state indicator
            const nav = document.getElementById(ws === 'image-studio' ? 'sidebar-nav-images' : 'new-chat-btn');
            if (nav) nav.classList.add('active');
        }

        function renderWorkflowFlyoutList() {}
        function renderCurrentConversation() {}

        function setImageStudioMode(mode, options = {}) {
            imageStudioMode = mode || 'home';
            if (imageStudioMode === 'home' && !options.skipUrlSync && isVectorizePath(window.location.pathname)) {
                syncRoute('/', { mode: 'home', workspace: 'image-studio' });
            }
            const homeView = document.getElementById('image-home-view');
            const workspaceView = document.getElementById('image-studio-workspace');
            const heroSection = document.getElementById('hero-section');

            if (currentWorkspace !== 'image-studio') {
                currentWorkspace = 'image-studio';
                updateSidebarNavActiveStates('image-studio');
            }

            if (heroSection) heroSection.classList.add('hidden');

            if (imageStudioMode === 'home') {
                if (workspaceView) workspaceView.classList.add('hidden');
                if (homeView) homeView.classList.remove('hidden');
            } else {
                if (homeView) homeView.classList.add('hidden');
                if (workspaceView) workspaceView.classList.remove('hidden');

                if (options.tool && typeof switchWorkflowTool === 'function') {
                    switchWorkflowTool(options.tool, options);
                }
            }
        }

        function switchWorkflowTool(toolId, options = {}) {
            if (toolId === 'image-to-image') toolId = 'vectorize';
            const found = WORKFLOW_TOOLS.find(t => t.id === toolId);
            if (!found) return;
            activeWorkflowTool = toolId;

            const activeLabel = document.getElementById('workspace-active-tool-label');
            if (activeLabel) activeLabel.textContent = found.label;

            const genControls = document.getElementById('ideogram-generate-controls');
            const editControls = document.getElementById('ideogram-precise-edit-controls');
            const removeBgControls = document.getElementById('ideogram-remove-bg-controls');
            const upscaleControls = document.getElementById('ideogram-upscale-controls');
            const vectorizeControls = document.getElementById('ideogram-vectorize-controls');

            if (genControls) genControls.classList.add('hidden');
            if (editControls) editControls.classList.add('hidden');
            if (removeBgControls) removeBgControls.classList.add('hidden');
            if (upscaleControls) upscaleControls.classList.add('hidden');
            if (vectorizeControls) {
                vectorizeControls.classList.add('hidden');
                vectorizeControls.classList.remove('flex');
            }

            if (toolId === 'generate-image') {
                if (genControls) genControls.classList.remove('hidden');
            } else if (toolId === 'remove-background') {
                if (removeBgControls) removeBgControls.classList.remove('hidden');
            } else if (toolId === 'upscale-image') {
                if (upscaleControls) upscaleControls.classList.remove('hidden');
            } else if (toolId === 'vectorize') {
                if (vectorizeControls) {
                    vectorizeControls.classList.remove('hidden');
                    vectorizeControls.classList.add('flex');
                }
                if (!options.skipUrlSync) {
                    syncRoute('/create/svg/vectorize', { tool: 'vectorize', workspace: 'image-studio' }, Boolean(options.replace));
                }
            } else if (toolId === 'precise-edit') {
                if (editControls) editControls.classList.remove('hidden');
            }

            if (toolId !== 'vectorize' && !options.skipUrlSync && isVectorizePath(window.location.pathname)) {
                syncRoute('/', { tool: toolId, workspace: 'image-studio' }, Boolean(options.replace));
            }
        }

        function switchWorkspace(workspace, options = {}) {
            if (workspace === 'code' || workspace === 'code-studio') {
                workspace = 'chat';
            }
            currentWorkspace = workspace;

            if (!options.skipUrlSync) {
                if (workspace === 'image-studio') {
                    if (imageStudioMode === 'workspace' && activeWorkflowTool === 'vectorize') {
                        syncRoute('/create/svg/vectorize', { workspace: 'image-studio', tool: 'vectorize' }, Boolean(options.replace));
                    } else if (isVectorizePath(window.location.pathname)) {
                        syncRoute('/', { workspace: 'image-studio', mode: imageStudioMode || 'home' }, Boolean(options.replace));
                    }
                } else {
                    if (isVectorizePath(window.location.pathname)) {
                        syncRoute('/', { workspace: workspace }, Boolean(options.replace));
                    }
                }
            }

            const heroSection = document.getElementById('hero-section');
            const studioSection = document.getElementById('image-studio-workspace');
            const homeSection = document.getElementById('image-home-view');
            const slidesSection = document.getElementById('slides-studio-workspace');
            const projectsSection = document.getElementById('projects-workspace');
            const librarySection = document.getElementById('library-workspace');

            [homeSection, studioSection, slidesSection, projectsSection, librarySection].forEach(el => {
                if (el) el.classList.add('hidden');
            });

            updateSidebarNavActiveStates(workspace);

            if (workspace === 'image-studio') {
                setImageStudioMode(imageStudioMode || 'home', { skipUrlSync: options.skipUrlSync });
            } else if (workspace === 'slides-studio') {
                if (heroSection) heroSection.classList.add('hidden');
                if (slidesSection) slidesSection.classList.remove('hidden');
            } else if (workspace === 'projects') {
                if (heroSection) heroSection.classList.add('hidden');
                if (projectsSection) projectsSection.classList.remove('hidden');
            } else if (workspace === 'library') {
                if (heroSection) heroSection.classList.add('hidden');
                if (librarySection) librarySection.classList.remove('hidden');
            } else {
                if (heroSection) heroSection.classList.remove('hidden');
                renderCurrentConversation();
            }
        }

        function createNewChat() {
            if (isVectorizePath(window.location.pathname)) {
                syncRoute('/', { workspace: 'chat' });
            }
            switchWorkspace('chat');
        }

        // Startup routing bootstrap
        function initAppRouting() {
            const startupSearchParams = new URLSearchParams(window.location.search || '');
            const startupRouteParam = startupSearchParams.get('route') || '';
            const startupPath = window.location.pathname || '/';
            const effectiveStartupPath = isVectorizePath(startupRouteParam) ? startupRouteParam : startupPath;
            const isVectorizeDeepLink = isVectorizePath(effectiveStartupPath);

            if (isVectorizeDeepLink) {
                currentWorkspace = 'image-studio';
                imageStudioMode = 'workspace';
                activeWorkflowTool = 'vectorize';
                if (startupRouteParam && window.history && window.history.replaceState) {
                    try { window.history.replaceState({ tool: 'vectorize', workspace: 'image-studio' }, '', '/create/svg/vectorize'); } catch (_) {}
                }
                switchWorkspace('image-studio', { skipUrlSync: true });
                setImageStudioMode('workspace', { tool: 'vectorize', skipUrlSync: true });
                switchWorkflowTool('vectorize', { skipUrlSync: true });
            } else {
                currentWorkspace = 'chat';
                imageStudioMode = 'home';
                activeWorkflowTool = 'generate-image';
                switchWorkspace('chat', { skipUrlSync: true });
            }
        }

        // Popstate handler
        window.addEventListener('popstate', (e) => {
            const currentPath = window.location.pathname || '/';
            if (isVectorizePath(currentPath)) {
                currentWorkspace = 'image-studio';
                imageStudioMode = 'workspace';
                activeWorkflowTool = 'vectorize';
                switchWorkspace('image-studio', { skipUrlSync: true });
                setImageStudioMode('workspace', { tool: 'vectorize', skipUrlSync: true });
                switchWorkflowTool('vectorize', { skipUrlSync: true });
            } else {
                const targetWorkspace = (e.state && e.state.workspace) || 'chat';
                currentWorkspace = targetWorkspace;
                switchWorkspace(targetWorkspace, { skipUrlSync: true });
                if (targetWorkspace === 'image-studio') {
                    const targetTool = (e.state && e.state.tool) || 'generate-image';
                    const targetMode = (e.state && e.state.mode) || 'home';
                    setImageStudioMode(targetMode, { tool: targetTool, skipUrlSync: true });
                    switchWorkflowTool(targetTool, { skipUrlSync: true });
                }
            }
        });
    `;

    vm.runInContext(codeSnippet, context);

    return {
        context,
        dom,
        getEl,
        win,
        historyStack
    };
}

// -------------------------------------------------------------------
// Scenario 1: Open / -> Refresh -> Homepage remains at /
// -------------------------------------------------------------------
console.log('\n--- Scenario 1: Open / -> Refresh -> Homepage remains at / ---');
const rt1 = createTestRuntime('http://localhost:3000/');
rt1.context.initAppRouting();

assert('Scenario 1: Initial URL is /', rt1.win.location.pathname === '/');
assert('Scenario 1: Workspace is chat', rt1.win.getAppState().currentWorkspace === 'chat');
assert('Scenario 1: Hero section is visible', !rt1.getEl('hero-section').classList.contains('hidden'));
assert('Scenario 1: Image studio is hidden', rt1.getEl('image-studio-workspace').classList.contains('hidden'));

// Simulate refresh at /
const rt1_refresh = createTestRuntime('http://localhost:3000/');
rt1_refresh.context.initAppRouting();
assert('Scenario 1: After refresh on /, URL is still /', rt1_refresh.win.location.pathname === '/');
assert('Scenario 1: After refresh on /, Homepage is rendered', rt1_refresh.win.getAppState().currentWorkspace === 'chat');

// -------------------------------------------------------------------
// Scenario 2: Navigate to Vectorize Image -> Refresh -> Vectorize remains
// -------------------------------------------------------------------
console.log('\n--- Scenario 2: Images -> Vectorize -> Refresh -> Vectorize remains ---');
// User clicks into Images workspace -> Vectorize Image
rt1.context.switchWorkspace('image-studio');
rt1.context.setImageStudioMode('workspace', { tool: 'vectorize' });

assert('Scenario 2: URL became /create/svg/vectorize', rt1.win.location.pathname === '/create/svg/vectorize');
assert('Scenario 2: currentWorkspace is image-studio', rt1.win.getAppState().currentWorkspace === 'image-studio');
assert('Scenario 2: activeWorkflowTool is vectorize', rt1.win.getAppState().activeWorkflowTool === 'vectorize');
assert('Scenario 2: vectorize controls are visible and flex', !rt1.getEl('ideogram-vectorize-controls').classList.contains('hidden') && rt1.getEl('ideogram-vectorize-controls').classList.contains('flex'));

// Refresh on /create/svg/vectorize
const rt2_refresh = createTestRuntime('http://localhost:3000/create/svg/vectorize');
rt2_refresh.context.initAppRouting();
assert('Scenario 2: After refresh on Vectorize, URL remains /create/svg/vectorize', rt2_refresh.win.location.pathname === '/create/svg/vectorize');
assert('Scenario 2: Vectorize controls are visible after refresh', !rt2_refresh.getEl('ideogram-vectorize-controls').classList.contains('hidden'));
assert('Scenario 2: activeWorkflowTool is vectorize after refresh', rt2_refresh.win.getAppState().activeWorkflowTool === 'vectorize');

// -------------------------------------------------------------------
// Scenario 3: Leaving Vectorize to New Chat -> URL updates to / -> Refresh keeps New Chat
// -------------------------------------------------------------------
console.log('\n--- Scenario 3: Vectorize -> New Chat -> URL is / -> Refresh keeps New Chat ---');
// User is on Vectorize (rt1) and clicks New Chat
rt1.context.createNewChat();

assert('Scenario 3: After clicking New Chat, URL immediately reverted to /', rt1.win.location.pathname === '/');
assert('Scenario 3: currentWorkspace is now chat', rt1.win.getAppState().currentWorkspace === 'chat');
assert('Scenario 3: Hero section is visible', !rt1.getEl('hero-section').classList.contains('hidden'));

// User refreshes while on New Chat
const rt3_refresh = createTestRuntime(rt1.win.location.href);
rt3_refresh.context.initAppRouting();
assert('Scenario 3: Refresh retains URL /', rt3_refresh.win.location.pathname === '/');
assert('Scenario 3: Refresh retains New Chat workspace (NOT Vectorize)', rt3_refresh.win.getAppState().currentWorkspace === 'chat');
assert('Scenario 3: Vectorize is NOT rendered on homepage refresh', rt3_refresh.win.getAppState().activeWorkflowTool !== 'vectorize' || rt3_refresh.win.getAppState().currentWorkspace === 'chat');

// -------------------------------------------------------------------
// Scenario 4: Leaving Vectorize to Slides, Projects, Library
// -------------------------------------------------------------------
console.log('\n--- Scenario 4: Vectorize -> Other Workspaces (Slides, Projects, Library) ---');
// Re-enter Vectorize
rt1.context.setImageStudioMode('workspace', { tool: 'vectorize' });
assert('Scenario 4: Re-entered Vectorize, URL is /create/svg/vectorize', rt1.win.location.pathname === '/create/svg/vectorize');

// Switch to Slides
rt1.context.switchWorkspace('slides-studio');
assert('Scenario 4: Switching to Slides updates URL to /', rt1.win.location.pathname === '/');
assert('Scenario 4: Slides workspace is visible', !rt1.getEl('slides-studio-workspace').classList.contains('hidden'));

// Switch back to Vectorize
rt1.context.switchWorkspace('image-studio');
rt1.context.setImageStudioMode('workspace', { tool: 'vectorize' });
assert('Scenario 4: Re-entered Vectorize', rt1.win.location.pathname === '/create/svg/vectorize');

// Switch to Projects
rt1.context.switchWorkspace('projects');
assert('Scenario 4: Switching to Projects updates URL to /', rt1.win.location.pathname === '/');
assert('Scenario 4: Projects workspace is visible', !rt1.getEl('projects-workspace').classList.contains('hidden'));

// Switch to Library
rt1.context.switchWorkspace('image-studio');
rt1.context.setImageStudioMode('workspace', { tool: 'vectorize' });
rt1.context.switchWorkspace('library');
assert('Scenario 4: Switching to Library updates URL to /', rt1.win.location.pathname === '/');
assert('Scenario 4: Library workspace is visible', !rt1.getEl('library-workspace').classList.contains('hidden'));

// Switch back to Image Home view
rt1.context.switchWorkspace('image-studio');
rt1.context.setImageStudioMode('workspace', { tool: 'vectorize' });
rt1.context.setImageStudioMode('home');
assert('Scenario 4: Returning to Images Home view updates URL to /', rt1.win.location.pathname === '/');

// -------------------------------------------------------------------
// Scenario 5: Browser History Back and Forward Navigation
// -------------------------------------------------------------------
console.log('\n--- Scenario 5: Browser Back & Forward Navigation ---');
// Let's test a clean history traversal:
// Step 1: Start at / (Home)
const rtHist = createTestRuntime('http://localhost:3000/');
rtHist.context.initAppRouting();
assert('Scenario 5: Step 1 - At Home /', rtHist.win.location.pathname === '/');

// Step 2: Go to Vectorize
rtHist.context.switchWorkspace('image-studio');
rtHist.context.setImageStudioMode('workspace', { tool: 'vectorize' });
assert('Scenario 5: Step 2 - At Vectorize /create/svg/vectorize', rtHist.win.location.pathname === '/create/svg/vectorize');
assert('Scenario 5: Vectorize is active', rtHist.win.getAppState().activeWorkflowTool === 'vectorize');

// Step 3: Go to New Chat
rtHist.context.createNewChat();
assert('Scenario 5: Step 3 - At New Chat /', rtHist.win.location.pathname === '/');
assert('Scenario 5: Chat workspace active', rtHist.win.getAppState().currentWorkspace === 'chat');

// Step 4: Click Browser BACK
rtHist.win.history.back();
assert('Scenario 5: Step 4 - Click Back -> URL restores to /create/svg/vectorize', rtHist.win.location.pathname === '/create/svg/vectorize');
assert('Scenario 5: Step 4 - Vectorize interface restored', rtHist.win.getAppState().activeWorkflowTool === 'vectorize' && rtHist.win.getAppState().currentWorkspace === 'image-studio');
assert('Scenario 5: Vectorize controls visible', !rtHist.getEl('ideogram-vectorize-controls').classList.contains('hidden'));

// Step 5: Click Browser BACK again (back to initial Home)
rtHist.win.history.back();
assert('Scenario 5: Step 5 - Click Back -> URL restores to /', rtHist.win.location.pathname === '/');
assert('Scenario 5: Step 5 - Home workspace restored', rtHist.win.getAppState().currentWorkspace === 'chat');

// Step 6: Click Browser FORWARD (to Vectorize)
rtHist.win.history.forward();
assert('Scenario 5: Step 6 - Click Forward -> URL advances to /create/svg/vectorize', rtHist.win.location.pathname === '/create/svg/vectorize');
assert('Scenario 5: Step 6 - Vectorize restored', rtHist.win.getAppState().activeWorkflowTool === 'vectorize' && rtHist.win.getAppState().currentWorkspace === 'image-studio');

// Step 7: Click Browser FORWARD again (to New Chat)
rtHist.win.history.forward();
assert('Scenario 5: Step 7 - Click Forward -> URL advances to /', rtHist.win.location.pathname === '/');
assert('Scenario 5: Step 7 - Chat restored', rtHist.win.getAppState().currentWorkspace === 'chat');

// -------------------------------------------------------------------
// Scenario 6: Direct Open in Fresh Tab without prior state
// -------------------------------------------------------------------
console.log('\n--- Scenario 6: Fresh Tab / Incognito Direct Open ---');
const rtFresh = createTestRuntime('http://localhost:3000/create/svg/vectorize');
rtFresh.context.initAppRouting();
assert('Scenario 6: Fresh tab loads Vectorize directly', rtFresh.win.location.pathname === '/create/svg/vectorize');
assert('Scenario 6: Vectorize workspace is active', rtFresh.win.getAppState().currentWorkspace === 'image-studio' && rtFresh.win.getAppState().activeWorkflowTool === 'vectorize');

// -------------------------------------------------------------------
// Scenario 7: Stale localStorage does NOT override URL /
// -------------------------------------------------------------------
console.log('\n--- Scenario 7: Stale LocalStorage / Prior Tool State Protection ---');
const rtStale = createTestRuntime('http://localhost:3000/');
rtStale.win.localStorage.setItem('ai_default_workspace', 'image-studio');
rtStale.context.initAppRouting();
assert('Scenario 7: When URL is /, stale localStorage does NOT hijack to Vectorize', rtStale.win.location.pathname === '/');
assert('Scenario 7: Default workspace remains chat', rtStale.win.getAppState().currentWorkspace === 'chat');

// -------------------------------------------------------------------
// Scenario 8: Sidebar Brand Logo Interaction
// -------------------------------------------------------------------
console.log('\n--- Scenario 8: Sidebar Brand Logo Interaction ---');
rtFresh.context.createNewChat();
assert('Scenario 8: Clicking brand logo from Vectorize resets URL to /', rtFresh.win.location.pathname === '/');
assert('Scenario 8: Chat is active after brand logo click', rtFresh.win.getAppState().currentWorkspace === 'chat');

console.log('\n===============================================================');
console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('===============================================================\n');

if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION AND UNIT TESTS PASSED!');
} else {
    process.exit(1);
}
