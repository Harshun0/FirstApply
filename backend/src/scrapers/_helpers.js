import crypto from 'crypto';
import axios from 'axios';

export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// Deterministic id so the same listing is never re-sent.
export function makeJobId(title, company, source) {
  return crypto
    .createHash('md5')
    .update(`${title || ''}${company || ''}${source || ''}`)
    .digest('hex');
}

export function delay(ms = 1000) {
  return new Promise((r) => setTimeout(r, ms));
}

// Shared GET with the anti-block headers, a sane timeout, and a 1s courtesy
// delay before the request so concurrent scrapers don't hammer in lockstep.
export async function fetchHtml(url, { timeout = 15000, headers = {} } = {}) {
  await delay(1000);
  const res = await axios.get(url, {
    timeout,
    headers: { ...DEFAULT_HEADERS, ...headers },
    // Some sites 403 bots; accept any 2xx/3xx and let the parser decide.
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return res.data;
}

// Resolve a possibly-relative href against the site origin.
export function absoluteUrl(href, base) {
  if (!href) return '';
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

export function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}
