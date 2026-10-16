const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  // Navigation
  ['btn-action-slides exists', html.includes('id="btn-action-slides"')],
  ['sidebar-nav-slides exists', html.includes('id="sidebar-nav-slides"')],
  ['slides-studio-workspace exists', html.includes('id="slides-studio-workspace"')],
  ['slides-studio case in switchWorkspace', html.includes("slides-studio-workspace")],

  // Composer
  ['slides-prompt-input', html.includes('id="slides-prompt-input"')],
  ['slides-composer-box', html.includes('id="slides-composer-box"')],
  ['slides-prompt-error', html.includes('id="slides-prompt-error"')],
  ['slides-selected-template-badge', html.includes('id="slides-selected-template-badge"')],
  ['slides-generate-btn', html.includes('id="slides-generate-btn"')],

  // Dropdowns
  ['slides-tone-btn', html.includes('id="slides-tone-btn"')],
  ['slides-tone-dropdown', html.includes('id="slides-tone-dropdown"')],
  ['slides-mode-btn', html.includes('id="slides-mode-btn"')],
  ['slides-style-btn', html.includes('id="slides-style-btn"')],
  ['slides-visual-btn', html.includes('id="slides-visual-btn"')],
  ['slides-count-btn', html.includes('id="slides-count-btn"')],

  // Loading state
  ['slides-loading-state', html.includes('id="slides-loading-state"')],
  ['slides-progress-bar (loading bar)', html.includes('id="slides-progress-bar"')],
  ['slides-loading-title (step title)', html.includes('id="slides-loading-title"')],

  // Deck viewer
  ['slides-presentation-deck', html.includes('id="slides-presentation-deck"')],
  ['slides-active-canvas', html.includes('id="slides-active-canvas"')],
  ['slides-thumbnail-strip', html.includes('id="slides-thumbnail-strip"')],
  ['slides-deck-prev (prev btn)', html.includes('id="slides-deck-prev"')],
  ['slides-deck-next (next btn)', html.includes('id="slides-deck-next"')],
  ['slides-deck-counter (counter)', html.includes('id="slides-deck-counter"')],
  ['slides-new-deck-btn (new btn)', html.includes('id="slides-new-deck-btn"')],
  ['slides-export-btn', html.includes('id="slides-export-btn"')],

  // Templates
  ['slides-templates-section', html.includes('id="slides-templates-section"')],
  ['slides-template-search', html.includes('id="slides-template-search"')],
  ['slides-search-clear', html.includes('id="slides-search-clear"')],
  ['slides-templates-grid', html.includes('id="slides-templates-grid"')],
  ['slides-templates-empty', html.includes('id="slides-templates-empty"')],

  // JS logic
  ['slidesStudioState defined', html.includes('const slidesStudioState')],
  ['SLIDES_TEMPLATES defined', html.includes('const SLIDES_TEMPLATES')],
  ['generateSlides function', html.includes('function generateSlides()')],
  ['renderActiveSlide function', html.includes('function renderActiveSlide()')],
  ['renderSlidesTemplates function', html.includes('function renderSlidesTemplates')],
  ['applySlidesTemplate function', html.includes('function applySlidesTemplate')],
  ['buildDemoDeck function', html.includes('function buildDemoDeck')],
  ['initSlidesStudio called', html.includes('initSlidesStudio()')],
  ["slides-studio switchWorkspace", html.includes("switchWorkspace('slides-studio')")],

  // Slide types
  ["cover slide", html.includes("type: 'cover'")],
  ["overview slide", html.includes("type: 'overview'")],
  ["features slide", html.includes("type: 'features'")],
  ["process slide", html.includes("type: 'process'")],
  ["metrics slide", html.includes("type: 'metrics'")],
  ["conclusion slide", html.includes("type: 'conclusion'")],

  // 12 Templates
  ['Project Review template', html.includes('Project Review')],
  ['Pitch Deck template', html.includes('Pitch Deck')],
  ['Sales Report template', html.includes('Sales Report')],
  ['Enterprise template', html.includes('tmpl-enterprise')],
  ['Product Overview template', html.includes('Product Overview')],
  ['Marketing Strategy template', html.includes('Marketing Strategy')],
  ['Education template', html.includes('tmpl-education')],
  ['Business Proposal template', html.includes('Business Proposal')],
  ['Research template', html.includes('tmpl-research')],
  ['Portfolio template', html.includes('tmpl-portfolio')],
  ['Case Study template', html.includes('Case Study')],
  ['Company Introduction template', html.includes('Company Introduction')],

  // Showcase
  ['AI Presentation Engine badge', html.includes('AI Presentation Engine')],
  ['switchWorkspace handles slides-studio branch', html.includes("workspace === 'slides-studio'")],
];

// JS syntax check
let jsSyntaxOk = false;
try {
  const scriptMatch = html.match(/<script>\s*lucide\.createIcons\(\);[\s\S]*?<\/script>/i);
  if (scriptMatch) {
    new Function(scriptMatch[0].replace(/<\/?script>/gi, ''));
    jsSyntaxOk = true;
  }
} catch (e) {
  console.error('JS SYNTAX ERROR:', e.message);
}
checks.push(['JS syntax valid', jsSyntaxOk]);

let passed = 0, failed = 0;
checks.forEach(([name, pass]) => {
  console.log((pass ? '✅' : '❌') + ' ' + name);
  pass ? passed++ : failed++;
});
console.log('');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
