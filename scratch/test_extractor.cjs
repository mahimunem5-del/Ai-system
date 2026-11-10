const assert = require('assert');

function extractAndFormatImage(item) {
  if (!item) return null;
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object') return item.url || item.image || (item.b64_json ? 'data:image/jpeg;base64,' + item.b64_json : null);
  return null;
}

function extractImagesFromChatCompletion(responseData) {
  if (!responseData) return [];
  const foundUrls = [];
  const addIfValid = (candidate) => {
    if (!candidate) return;
    const formatted = extractAndFormatImage(candidate);
    if (formatted && !foundUrls.includes(formatted)) foundUrls.push(formatted);
  };
  if (Array.isArray(responseData.choices)) {
    for (const choice of responseData.choices) {
      const msg = choice?.message;
      if (!msg) continue;
      if (Array.isArray(msg.images)) {
        for (const img of msg.images) {
          if (typeof img === 'string') addIfValid(img);
          else if (img?.image_url?.url) addIfValid(img.image_url.url);
          else if (img?.url) addIfValid(img.url);
          else if (img?.image) addIfValid(img.image);
          else if (img?.b64_json) addIfValid(img.b64_json);
        }
      }
      if (msg.image) {
        if (typeof msg.image === 'string') addIfValid(msg.image);
        else if (msg.image?.url) addIfValid(msg.image.url);
      }
      const content = msg.content;
      if (typeof content === 'string') {
        const mdRegex = /!\[.*?\]\((https?:\/\/[^\s)]+|data:image\/[^\s)]+)\)/gi;
        let match;
        let foundMd = false;
        while ((match = mdRegex.exec(content)) !== null) {
          if (match[1]) { addIfValid(match[1]); foundMd = true; }
        }
        if (!foundMd) {
          const trimmed = content.trim();
          if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            addIfValid(trimmed);
          } else {
            const urlRegex = /(https?:\/\/[^\s"'<>\)]+|data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)/g;
            let urlMatch;
            while ((urlMatch = urlRegex.exec(content)) !== null) {
              if (urlMatch[1]) addIfValid(urlMatch[1]);
            }
          }
        }
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (part?.type === 'image_url' && part?.image_url?.url) addIfValid(part.image_url.url);
          else if (part?.type === 'image' && (part?.image || part?.url)) addIfValid(part.image || part.url);
          else if (part?.image_url && typeof part.image_url === 'string') addIfValid(part.image_url);
        }
      }
    }
  }
  if (Array.isArray(responseData.data)) {
    for (const item of responseData.data) addIfValid(item);
  }
  if (Array.isArray(responseData.images)) {
    for (const item of responseData.images) addIfValid(item);
  }
  if (responseData.url || responseData.imageUrl) {
    addIfValid(responseData.url || responseData.imageUrl);
  }
  return foundUrls;
}

const tests = [
  { choices: [{ message: { content: 'Here is your image: ![result](https://example.com/flux.png)' } }] },
  { choices: [{ message: { content: 'https://example.com/direct.png' } }] },
  { choices: [{ message: { content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' } }] },
  { choices: [{ message: { images: [{ image_url: { url: 'https://example.com/img1.png' } }] } }] },
  { choices: [{ message: { content: [{ type: 'image_url', image_url: { url: 'https://example.com/part.png' } }] } }] },
  { data: [{ url: 'https://example.com/data.png' }] }
];

tests.forEach((t, i) => {
  const res = extractImagesFromChatCompletion(t);
  console.log(`Test ${i + 1} extracted:`, res);
  assert.strictEqual(res.length, 1);
});

console.log('All 6 chat completions extraction test cases PASSED!');

