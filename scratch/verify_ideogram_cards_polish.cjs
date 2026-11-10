const fs = require('fs');

console.log('=== VERIFYING IDEOGRAM CARDS & SCROLLBAR POLISH ===\n');

// 1. Check index.html
const html = fs.readFileSync('index.html', 'utf8');

const htmlChecks = [
    {
        name: 'Zero-scrollbar CSS rule in <style>',
        test: html.includes('#creative-workflows-carousel') && html.includes('scrollbar-width: none !important') && html.includes('::-webkit-scrollbar')
    },
    {
        name: 'Carousel element has exact scrollbar hiding utility classes',
        test: html.includes('id="creative-workflows-carousel"') &&
              html.includes('[scrollbar-width:none]') &&
              html.includes('[-ms-overflow-style:none]') &&
              html.includes('[&::-webkit-scrollbar]:hidden') &&
              html.includes('no-scrollbar')
    },
    {
        name: 'Card width & height dimensions (285px x 180px)',
        test: (html.match(/w-\[285px\] min-w-\[285px\] max-w-\[285px\] h-\[180px\]/g) || []).length === 6
    },
    {
        name: 'Card border styling (rounded-2xl border-neutral-200/50 dark:border-neutral-800/50)',
        test: (html.match(/rounded-2xl overflow-hidden border border-neutral-200\/50 dark:border-neutral-800\/50/g) || []).length === 6
    },
    {
        name: 'Typography: text-[13.5px] font-medium tracking-tight mt-2.5 px-0.5',
        test: (html.match(/mt-2\.5 px-0\.5 text-\[13\.5px\] font-medium tracking-tight text-neutral-800 dark:text-neutral-200/g) || []).length === 6
    },
    {
        name: 'Bottom-left badges: w-9 h-9 backdrop-blur-md shadow-md rounded-xl',
        test: (html.match(/w-9 h-9 flex items-center justify-center bg-white\/95 dark:bg-neutral-900\/95 backdrop-blur-md shadow-md rounded-xl/g) || []).length === 6
    },
    {
        name: 'Split visuals in Card 2 and 4 match 285px x 180px proportions',
        test: html.includes('w-[285px] h-[180px] object-cover') && html.includes('-left-[142.5px]')
    }
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

// 2. Check ImageWorkspace.tsx
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

const tsxChecks = [
    {
        name: 'Carousel element has exact scrollbar hiding utility classes',
        test: tsx.includes('id="creative-workflows-carousel"') &&
              tsx.includes('[scrollbar-width:none]') &&
              tsx.includes('[-ms-overflow-style:none]') &&
              tsx.includes('[&::-webkit-scrollbar]:hidden') &&
              tsx.includes('no-scrollbar')
    },
    {
        name: 'Card width & height dimensions (285px x 180px)',
        test: (tsx.match(/w-\[285px\] min-w-\[285px\] max-w-\[285px\] h-\[180px\]/g) || []).length === 6
    },
    {
        name: 'Card border styling (rounded-2xl border-neutral-200/50 dark:border-neutral-800/50)',
        test: (tsx.match(/rounded-2xl overflow-hidden border border-neutral-200\/50 dark:border-neutral-800\/50/g) || []).length === 6
    },
    {
        name: 'Typography: text-[13.5px] font-medium tracking-tight mt-2.5 px-0.5',
        test: (tsx.match(/mt-2\.5 px-0\.5 text-\[13\.5px\] font-medium tracking-tight text-neutral-800 dark:text-neutral-200/g) || []).length === 6
    },
    {
        name: 'Bottom-left badges: w-9 h-9 backdrop-blur-md shadow-md rounded-xl',
        test: (tsx.match(/w-9 h-9 flex items-center justify-center bg-white\/95 dark:bg-neutral-900\/95 backdrop-blur-md shadow-md rounded-xl/g) || []).length === 6
    },
    {
        name: 'Split visuals in Card 2 and 4 match 285px x 180px proportions',
        test: tsx.includes('w-[285px] h-[180px] object-cover') && tsx.includes('-left-[142.5px]')
    }
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
    console.log('\n🎉 ALL CHECKS PASSED WITH 100% PRECISION!');
} else {
    console.error(`\nFailed with ${htmlFailures} HTML and ${tsxFailures} TSX failures.`);
    process.exit(1);
}

