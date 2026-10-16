import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Serper.dev Google Search API Provider
 * High-performance Google Search API for real-time web search and deep research grounding.
 */
export async function searchSerper({
  query,
  num = 4,
  abortSignal = null,
  timeoutMs = config.timeouts.searchTimeoutMs,
  requestId = '-'
}) {
  const apiKey = config.serper?.apiKey || process.env.SERPER_API_KEY?.trim() || '';

  // Graceful Fallback: If SERPER_API_KEY is missing or placeholder, log notice and return empty results
  if (!apiKey || apiKey === 'your_serper_api_key_here') {
    logger.debug('Serper.dev API key is unconfigured. Returning empty results.', { requestId });
    return { results: [], formattedContext: '' };
  }

  const controller = new AbortController();
  if (abortSignal) {
    if (abortSignal.aborted) return { results: [], formattedContext: '' };
    abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      {
        q: query,
        num: num || 4
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        timeout: timeoutMs
      }
    );

    clearTimeout(timer);

    const organic = Array.isArray(response.data?.organic) ? response.data.organic : [];

    // Parse and format the returned organic results array
    const results = organic.slice(0, num || 4).map(item => ({
      title: item.title || 'Web Result',
      link: item.link || item.url || '#',
      url: item.link || item.url || '#',
      snippet: item.snippet || item.content || '',
      content: item.snippet || item.content || ''
    }));

    // Clean markdown context
    const formattedContext = results
      .map((r, i) => `[${i + 1}] Title: ${r.title}\nURL: ${r.link}\nExcerpt: ${r.snippet}`)
      .join('\n\n');

    return {
      results,
      formattedContext
    };
  } catch (err) {
    clearTimeout(timer);
    if (abortSignal?.aborted || controller.signal.aborted) {
      logger.debug('Serper search aborted or timed out', { requestId, query });
      return { results: [], formattedContext: '' };
    }
    logger.warn('Serper search request failed', { requestId, error: err.response?.data?.message || err.message });
    return { results: [], formattedContext: '' };
  }
}

export default {
  searchSerper
};
