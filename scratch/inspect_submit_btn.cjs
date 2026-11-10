const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const btnIdx = html.indexOf('id="image-home-submit-btn"');
console.log('--- index.html submit button ---');
console.log(html.slice(btnIdx - 50, btnIdx + 500));

const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const tsxBtnIdx = tsx.indexOf('rounded-full');
console.log('--- ImageWorkspace.tsx submit button area ---');
const btnSearch = tsx.indexOf('prompt.trim()');
console.log(tsx.slice(btnSearch - 100, btnSearch + 400));

