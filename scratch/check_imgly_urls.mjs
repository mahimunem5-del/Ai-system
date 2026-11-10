const res = await fetch('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/index.mjs');
const text = await res.text();
const allUrls = text.match(/https:\/\/[a-zA-Z0-9\.\-\_\/]+/g) || [];
console.log('unique URLs in imgly:', [...new Set(allUrls)].slice(0, 10));
const publicPathMatch = text.match(/publicPath[^,\}]+/);
console.log('publicPath match:', publicPathMatch ? publicPathMatch[0] : null);

