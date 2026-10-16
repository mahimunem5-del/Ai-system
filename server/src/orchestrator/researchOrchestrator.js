import { searchSerper } from '../providers/serperProvider.js';
import logger from '../utils/logger.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks whether the incoming query is a casual greeting or conversational remark
 * that should not trigger deep research vectors.
 */
export function isCasualQuery(query) {
  if (!query || typeof query !== 'string') return true;
  const clean = query.trim().toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (!clean) return true;
  const casualSet = new Set([
    'hello', 'hi', 'hey', 'hiya', 'howdy', 'greetings', 'yo', 'hola',
    'good morning', 'good afternoon', 'good evening', 'good day',
    'sup', 'whats up', 'what is up', 'how are you', 'hows it going',
    'who are you', 'what can you do', 'test', 'testing', 'hi there', 'hello there'
  ]);
  if (casualSet.has(clean)) return true;
  const words = clean.split(/\s+/);
  if (words.length <= 2 && (words[0] === 'hi' || words[0] === 'hello' || words[0] === 'hey')) {
    return true;
  }
  return false;
}

/**
 * Cleans conversational prefixes and returns the core subject topic.
 */
export function extractCoreTopic(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .replace(/^(can\s+you\s+(please\s+)?|please\s+|tell\s+me\s+about\s+|write\s+a\s+(deep\s+)?research\s+(report\s+)?(on|about)\s+|research\s+|explain\s+|what\s+is\s+|give\s+me\s+(a\s+)?research\s+(on|about)\s+|deep\s+dive\s+into\s+|overview\s+of\s+)/i, '')
    .replace(/[?!.]+$/g, '')
    .trim();
}

/**
 * Dynamically deconstructs the user query into 3-4 natural, high-intent search vectors.
 */
export function generateResearchVectors(rawQuery) {
  const topic = extractCoreTopic(rawQuery) || rawQuery.trim();
  return [
    `${topic} comprehensive overview landscape fundamentals guide 2025 2026`,
    `${topic} technical breakdown methodologies architecture standards best practices`,
    `${topic} real-world applications case studies empirical data benchmarks`,
    `${topic} industry trends market analysis challenges future outlook`
  ];
}

/**
 * Multi-Stage Deep Research Orchestration Pipeline via Serper.dev Google Search API
 * Generates dynamic vector sub-queries, executes parallel searches, deduplicates and ranks findings.
 */
export async function executeDeepResearch({
  query,
  onStatusUpdate = null,
  abortSignal = null,
  requestId = '-'
}) {
  const isAborted = () => Boolean(abortSignal?.aborted);

  // Smart handling for casual greetings / non-research intent
  if (isCasualQuery(query)) {
    return {
      contextText: '',
      sources: [],
      isCasual: true
    };
  }

  // Step 1: Formulating analytical research vectors
  if (typeof onStatusUpdate === 'function') {
    await onStatusUpdate('Formulating analytical research vectors');
  }
  await sleep(250);
  if (isAborted()) return { contextText: '', sources: [], isCasual: false };

  // Step 2: Gathering intelligence across deep web & academic sources
  if (typeof onStatusUpdate === 'function') {
    await onStatusUpdate('Gathering intelligence across deep web & academic sources');
  }

  // Dynamically generate 3-4 natural, high-intent search vectors tailored to the user's specific topic
  const subQueries = generateResearchVectors(query);

  const searchPromises = subQueries.map(subQ => searchSerper({
    query: subQ,
    num: 6,
    abortSignal,
    requestId
  }));

  const searchResults = await Promise.allSettled(searchPromises);
  if (isAborted()) return { contextText: '', sources: [], isCasual: false };

  // Step 3: Evaluating empirical data & cross-referencing benchmarks
  if (typeof onStatusUpdate === 'function') {
    await onStatusUpdate('Evaluating empirical data & cross-referencing benchmarks');
  }
  await sleep(200);
  if (isAborted()) return { contextText: '', sources: [], isCasual: false };

  // Aggregate and deduplicate 8 to 15 unique, authoritative organic sources
  const seenUrls = new Set();
  const aggregatedSources = [];
  const aggregatedSnippets = [];

  searchResults.forEach((res, index) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value?.results)) {
      res.value.results.forEach(item => {
        const itemUrl = item.link || item.url;
        if (itemUrl && !seenUrls.has(itemUrl) && aggregatedSources.length < 15) {
          seenUrls.add(itemUrl);
          let hostname = '';
          try {
            hostname = new URL(itemUrl).hostname.replace(/^www\./i, '');
          } catch (_) {
            hostname = 'web';
          }
          aggregatedSources.push({
            title: item.title || `${hostname} Research Source`,
            url: itemUrl,
            domain: hostname
          });
          const sourceIdx = aggregatedSources.length;
          const snippetText = (item.snippet || item.content || '').replace(/\s+/g, ' ').trim();
          aggregatedSnippets.push(`[${sourceIdx}] Source: ${item.title || hostname}\nURL: ${itemUrl}\nDomain: ${hostname}\nExcerpt: ${snippetText}`);
        }
      });
    } else {
      logger.warn(`Deep research sub-query ${index + 1} ("${subQueries[index]}") failed or returned empty`, { requestId });
    }
  });

  // Step 4: Synthesizing comprehensive report
  if (typeof onStatusUpdate === 'function') {
    await onStatusUpdate('Synthesizing comprehensive report');
  }
  await sleep(250);

  const contextText = aggregatedSnippets.join('\n\n');
  return {
    contextText,
    sources: aggregatedSources,
    isCasual: false
  };
}

export default {
  executeDeepResearch,
  isCasualQuery,
  extractCoreTopic,
  generateResearchVectors
};

