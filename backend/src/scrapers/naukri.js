import * as cheerio from 'cheerio';
import { makeJobId, absoluteUrl, clean } from './_helpers.js';
import { fetchRendered } from './_browser.js';

const SOURCE = 'naukri';
const BASE = 'https://www.naukri.com';
const URL = 'https://www.naukri.com/fresher-jobs';

export async function scrapeJobs() {
  try {
    // Naukri's SRP is a React app — the HTML shell has no jobs, so render it.
    const html = await fetchRendered(URL, {
      waitForSelector: '.srp-jobtuple-wrapper, .cust-job-tuple',
      timeout: 40000,
      settleMs: 2000,
    });
    const $ = cheerio.load(html);
    const jobs = [];

    const cards = $('.srp-jobtuple-wrapper, .cust-job-tuple').toArray();

    for (const el of cards) {
      const node = $(el);
      const titleEl = node.find('a.title').first();
      const title = clean(titleEl.text());
      const href = titleEl.attr('href');
      const company = clean(node.find('.comp-name, a.comp-name').first().text());
      const location = clean(node.find('.locWdth, .loc-wrap span, span.locWdth').first().text());
      const experience = clean(node.find('.expwdth, .exp-wrap span, span.expwdth').first().text());

      if (!title) continue;

      jobs.push({
        title,
        company,
        location,
        experience: experience || 'fresher',
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
