import * as cheerio from 'cheerio';
import { makeJobId, absoluteUrl, clean } from './_helpers.js';
import { fetchRendered } from './_browser.js';

const SOURCE = 'wellfound';
const BASE = 'https://wellfound.com';
const URL = 'https://wellfound.com/jobs?role=software-engineer&jobType=full-time';

export async function scrapeJobs() {
  try {
    const html = await fetchRendered(URL, {
      waitForSelector: '[data-test="JobSearchResult"]',
      timeout: 40000,
      settleMs: 2500,
    });

    // Wellfound sits behind DataDome, which serves a CAPTCHA wall to bots.
    // Bypassing it reliably needs a residential proxy + CAPTCHA solver, so we
    // detect the wall and bail gracefully rather than emit garbage.
    if (/captcha-delivery|geo\.captcha|datadome|cf-challenge|Just a moment/i.test(html) || html.length < 5000) {
      console.error(`[${SOURCE}] blocked by DataDome/CAPTCHA — skipping (needs proxy + solver)`);
      return [];
    }

    const $ = cheerio.load(html);
    const jobs = [];

    const cards = $(
      '[data-test="JobSearchResult"], [data-test="StartupResult"], .job-listing'
    ).toArray();

    for (const el of cards) {
      const node = $(el);
      const titleEl = node.find('a[href*="/jobs/"], h3 a').first();
      const title = clean(titleEl.text());
      const href = titleEl.attr('href');
      const company = clean(node.find('[data-test="StartupResult"] h2, .startup-link, h2').first().text());
      const location = clean(node.find('[data-test="LocationsList"], .location').first().text());

      if (!title) continue;

      jobs.push({
        title,
        company,
        location,
        experience: '',
        applyLink: absoluteUrl(href || URL, BASE),
        source: SOURCE,
        jobId: makeJobId(title, company, SOURCE),
      });
    }

    console.log(`[${SOURCE}] scraped ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error(`[${SOURCE}] scrape failed:`, err.message);
    return [];
  }
}

export default scrapeJobs;
