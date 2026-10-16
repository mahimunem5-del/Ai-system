import { searchSerper } from '../providers/serperProvider.js';

/**
 * Executes fast Google web search via Serper.dev and builds grounded reference context
 */
export async function fetchWebContext({
  query,
  maxResults = 4,
  abortSignal = null,
  requestId = '-'
}) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { contextText: '', sources: [] };
  }

  const { results } = await searchSerper({
    query: query.trim(),
    num: maxResults || 4,
    abortSignal,
    requestId
  });

  if (!results || results.length === 0) {
    return { contextText: '', sources: [] };
  }

  // Deduplicate sources by URL
  const seenUrls = new Set();
  const sources = [];
  const snippets = [];

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    const linkUrl = item.link || item.url;
    if (linkUrl && !seenUrls.has(linkUrl)) {
      seenUrls.add(linkUrl);
      sources.push({
        title: item.title || 'Web Result',
        url: linkUrl
      });
      snippets.push(`[${sources.length}] Title: ${item.title}\nURL: ${linkUrl}\nExcerpt: ${item.snippet || item.content || ''}`);
    }
  }

  const contextText = snippets.join('\n\n');
  return { contextText, sources };
}

export default {
  fetchWebContext
};
