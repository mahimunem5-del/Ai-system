const fs = require('fs');

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Update transition rule in lines 323-328 to include border-color transition
const oldTransition = `        /* ─── Sidebar Transitions ─────────────────────────────────────── */
        #sidebar {
            transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1),
                transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }`;

const newTransition = `        /* ─── Sidebar Transitions ─────────────────────────────────────── */
        #sidebar {
            transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1),
                transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
                border-color 200ms ease;
            overflow: hidden;
        }`;

if (!html.includes(oldTransition)) {
  console.error('Could not find oldTransition in index.html');
  process.exit(1);
}
html = html.replace(oldTransition, newTransition);
console.log('✓ Transition rule updated to include border-color 200ms ease');

// 2. Update lines 880-888 to ensure no conflicting border-right: none
const oldDarkSidebar = `        html.dark #sidebar {
            background-color: #191919 !important;
            border-right: none !important;
            border-right-color: transparent !important;
            border-color: transparent !important;
        }`;

const newDarkSidebar = `        html.dark #sidebar {
            background-color: #191919 !important;
            border-color: transparent !important;
        }`;

if (!html.includes(oldDarkSidebar)) {
  console.error('Could not find oldDarkSidebar in index.html');
  process.exit(1);
}
html = html.replace(oldDarkSidebar, newDarkSidebar);
console.log('✓ Cleaned up dark sidebar rule in line 880');

// 3. Update the global shell sidebar rule with conditional border logic
const oldGlobalShell = `        /* Global Application Shell - Seamless Unified Canvas & Borderless Sidebar across All Views */
        #sidebar {
            border-right: none !important;
            border-right-color: transparent !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
        }
        html.dark #sidebar {
            border-right: none !important;
            border-right-color: transparent !important;
            box-shadow: none !important;
            background-color: #191919 !important;
        }`;

const newGlobalShell = `        /* Global Application Shell - Seamless Unified Canvas & Conditional Sidebar Border */
        #sidebar {
            background-color: #ffffff !important;
            border-right: 1px solid rgba(229, 231, 235, 0.5) !important; /* border-neutral-200/50 */
            box-shadow: none !important;
        }
        html.dark #sidebar {
            background-color: #191919 !important;
            border-right: 1px solid rgba(255, 255, 255, 0.08) !important; /* dark:border-neutral-800/50 */
            box-shadow: none !important;
        }
        /* When Sidebar is CLOSED / COLLAPSED (icon rail only): Remove right border completely (100% seamless) */
        #sidebar.sidebar-collapsed {
            border-right: 1px solid transparent !important;
            border-right-color: transparent !important;
            box-shadow: none !important;
        }
        html.dark #sidebar.sidebar-collapsed {
            border-right: 1px solid transparent !important;
            border-right-color: transparent !important;
            box-shadow: none !important;
        }`;

if (!html.includes(oldGlobalShell)) {
  console.error('Could not find oldGlobalShell in index.html');
  process.exit(1);
}
html = html.replace(oldGlobalShell, newGlobalShell);
console.log('✓ Global shell rule updated with conditional border logic');

// 4. Update <aside id="sidebar"> tag
const oldSidebarTag = `<aside id="sidebar"
        class="w-64 bg-white dark:bg-[#191919] border-r-0 border-transparent flex flex-col h-screen z-50 shrink-0 select-none">`;

const newSidebarTag = `<aside id="sidebar"
        class="w-64 bg-white dark:bg-[#191919] border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col h-screen z-50 shrink-0 select-none">`;

if (!html.includes(oldSidebarTag)) {
  console.error('Could not find oldSidebarTag in index.html');
  process.exit(1);
}
html = html.replace(oldSidebarTag, newSidebarTag);
console.log('✓ <aside id="sidebar"> markup updated with conditional border classes');

// 5. Update sidebar JS toggle to synchronize border classes
const oldToggleBlock = `            // ── Restore desktop collapsed state ──────────────────────────
            if (!isMobile() && localStorage.getItem(STORAGE_KEY) === '1') {
                sidebar.classList.add('sidebar-collapsed');
            }

            // ── Desktop: toggle collapsed/expanded ───────────────────────
            function toggleDesktopSidebar() {
                if (isMobile()) return;
                const isNowCollapsed = sidebar.classList.toggle('sidebar-collapsed');
                localStorage.setItem(STORAGE_KEY, isNowCollapsed ? '1' : '0');
            }`;

const newToggleBlock = `            // ── Sync conditional border classes with collapsed/open state ──
            function syncSidebarBorder() {
                if (sidebar.classList.contains('sidebar-collapsed')) {
                    sidebar.classList.remove('border-neutral-200/50', 'dark:border-neutral-800/50');
                    sidebar.classList.add('border-transparent');
                } else {
                    sidebar.classList.remove('border-transparent');
                    sidebar.classList.add('border-neutral-200/50', 'dark:border-neutral-800/50');
                }
            }

            // ── Restore desktop collapsed state ──────────────────────────
            if (!isMobile() && localStorage.getItem(STORAGE_KEY) === '1') {
                sidebar.classList.add('sidebar-collapsed');
            }
            syncSidebarBorder();

            // ── Desktop: toggle collapsed/expanded ───────────────────────
            function toggleDesktopSidebar() {
                if (isMobile()) return;
                const isNowCollapsed = sidebar.classList.toggle('sidebar-collapsed');
                localStorage.setItem(STORAGE_KEY, isNowCollapsed ? '1' : '0');
                syncSidebarBorder();
            }`;

if (!html.includes(oldToggleBlock)) {
  console.error('Could not find oldToggleBlock in index.html');
  process.exit(1);
}
html = html.replace(oldToggleBlock, newToggleBlock);
console.log('✓ Desktop toggle JS updated with syncSidebarBorder()');

// 6. Also sync in window resize event
const oldResizeBlock = `                    // Re-apply stored collapsed state
                    if (localStorage.getItem(STORAGE_KEY) === '1') {
                        sidebar.classList.add('sidebar-collapsed');
                    } else {
                        sidebar.classList.remove('sidebar-collapsed');
                    }`;

const newResizeBlock = `                    // Re-apply stored collapsed state
                    if (localStorage.getItem(STORAGE_KEY) === '1') {
                        sidebar.classList.add('sidebar-collapsed');
                    } else {
                        sidebar.classList.remove('sidebar-collapsed');
                    }
                    syncSidebarBorder();`;

if (!html.includes(oldResizeBlock)) {
  console.error('Could not find oldResizeBlock in index.html');
  process.exit(1);
}
html = html.replace(oldResizeBlock, newResizeBlock);
console.log('✓ Resize handler updated with syncSidebarBorder()');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\nSuccessfully saved conditional sidebar border updates to index.html!');

