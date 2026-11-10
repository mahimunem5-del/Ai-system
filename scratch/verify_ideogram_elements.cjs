const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const ideogramIds = [
  'id="ideogram-left-panel"',
  'id="ideogram-reset-composer-btn"',
  'id="ideogram-reference-section"',
  'id="ideogram-ref-status"',
  'id="ideogram-ref-dropzone"',
  'id="ideogram-ref-active-card"',
  'id="ideogram-ref-thumb"',
  'id="ideogram-ref-title"',
  'id="ideogram-ref-change-btn"',
  'id="ideogram-ref-remove-btn"',
  'id="ideogram-style-tags"',
  'id="ideogram-ratio-grid"',
  'id="ideogram-count-grid"',
  'id="ideogram-collection-select"',
  'id="ideogram-advanced-toggle"',
  'id="ideogram-advanced-chevron"',
  'id="ideogram-advanced-content"',
  'id="ideogram-negative-prompt"',
  'id="ideogram-seed-input"',
  'id="ideogram-seed-random-btn"',
  'id="ideogram-right-panel"',
  'id="ideogram-tab-assets"',
  'id="ideogram-assets-count-badge"',
  'id="ideogram-tab-api"',
  'id="ideogram-search-input"',
  'id="ideogram-search-clear"',
  'id="ideogram-filter-model"',
  'id="ideogram-filter-ratio"',
  'id="ideogram-sort-order"',
  'id="ideogram-density-toggle"',
  'id="ideogram-selection-bar"',
  'id="ideogram-selection-count"',
  'id="ideogram-select-all-btn"',
  'id="ideogram-download-selected-btn"',
  'id="ideogram-clear-selection-btn"',
  'id="ideogram-assets-viewport"',
  'id="ideogram-in-progress-card"',
  'id="ideogram-progress-status-text"',
  'id="ideogram-progress-prompt-text"',
  'id="ideogram-progress-model-badge"',
  'id="ideogram-progress-ratio-badge"',
  'id="ideogram-progress-bar-fill"',
  'id="ideogram-progress-skeletons"',
  'id="ideogram-asset-groups-feed"',
  'id="ideogram-empty-state"',
  'id="ideogram-empty-prompts"',
  'id="ideogram-filter-empty-state"',
  'id="ideogram-clear-filters-btn"',
  'id="ideogram-api-view"',
  'id="ideogram-api-lang-tabs"',
  'id="ideogram-api-copy-btn"',
  'id="ideogram-api-code-block"',
  // Preserved Chat Box & Model Elements
  'id="studio-composer-box"',
  'id="studio-model-btn"',
  'id="studio-model-dropdown"',
  'id="studio-prompt-input"',
  'id="studio-generate-btn"',
  // Lightbox Elements
  'id="studio-lightbox-modal"',
  'id="studio-lightbox-prev-btn"',
  'id="studio-lightbox-next-btn"',
  'id="studio-lightbox-counter"',
  'id="studio-lightbox-regenerate-btn"',
  'id="studio-lightbox-reuse-btn"',
  'id="studio-lightbox-copy-btn"',
  'id="studio-lightbox-download-btn"',
  'id="studio-lightbox-close-btn"'
];

let allPassed = true;
ideogramIds.forEach(id => {
  if (!html.includes(id)) {
    console.error('MISSING:', id);
    allPassed = false;
  }
});

if (allPassed) {
  console.log(`\n🎉 ALL ${ideogramIds.length} IDEOGRAM UI & PRESERVED ELEMENTS VERIFIED PRESENT!`);
} else {
  console.error('\n❌ SOME ELEMENTS WERE MISSING!');
  process.exit(1);
}
