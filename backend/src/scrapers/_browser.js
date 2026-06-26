import puppeteer from 'puppeteer';

// One Chromium instance is shared across all browser-based scrapers and reused
// between scrape cycles — launching Chromium per request would be far too heavy
// (especially on small Render instances). Pages are opened and closed per call.

let browserPromise = null;

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage', // avoid /dev/shm exhaustion in containers
  '--disable-gpu',
  '--disable-blink-features=AutomationControlled',
  '--window-size=1366,768',
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: LAUNCH_ARGS,
      // Respect an explicit Chrome path if the host provides one (Render/Docker).
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    // If launch fails, clear the cached promise so the next call can retry.
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

/**
 * Load a URL in a headless page, wait for JS to render, and return the HTML.
 * Always closes its page; never throws past the caller's try/catch contract.
 *
 * @param {string} url
 * @param {object} opts
 * @param {string} [opts.waitForSelector] CSS selector to wait for before reading.
 * @param {number} [opts.timeout]         Navigation/selector timeout (ms).
 * @param {number} [opts.settleMs]        Extra idle wait after load (ms).
 */
export async function fetchRendered(url, opts = {}) {
  const { waitForSelector, timeout = 35000, settleMs = 1500 } = opts;
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewport({ width: 1366, height: 768 });

    // Block images/fonts/media to cut bandwidth and speed up rendering.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'font' || type === 'media') req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout }).catch(() => {});
    }
    if (settleMs) await new Promise((r) => setTimeout(r, settleMs));

    return await page.content();
  } finally {
    await page.close().catch(() => {});
  }
}

export async function closeBrowser() {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    /* ignore */
  } finally {
    browserPromise = null;
  }
}
