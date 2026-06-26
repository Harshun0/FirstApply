import * as cheerio from 'cheerio';
import { makeJobId, absoluteUrl, clean } from './_helpers.js';
import { fetchRendered } from './_browser.js';

const SOURCE = 'indeed';
const BASE = 'https://in.indeed.com';
const URL = 'https://in.indeed.com/jobs?q=fresher+software+engineer&l=India';

export async function scrapeJobs() {
  try {
    // Indeed 403s plain HTTP and renders cards client-side — use the browser.
    const html = await fetchRendered(URL, {
      waitForSelector: '.job_seen_beacon',
      timeout: 40000,
      settleMs: 2000,
    });

    // Indeed sometimes serves a Cloudflare/"verify you are human" interstitial.
    if (/Just a moment|verify you are human|cf-challenge/i.test(html)) {
      console.error(`[${SOURCE}] blocked by anti-bot challenge`);
      return [];
    }

    const $ = cheerio.load(html);
    const jobs = [];

    const cards = $('.job_seen_beacon, .cardOutline').toArray();

    for (const el of cards) {
      const node = $(el);
      // Current Indeed markup: the job title + link live on a.jcs-JobTitle.
      const titleEl = node.find('a.jcs-JobTitle, h2.jobTitle a, .jobTitle a').first();
      const title = clean(titleEl.text()) || clean(node.find('.jobTitle').first().text());
      const company = clean(node.find('[data-testid="company-name"], .companyName').first().text());
      const location = clean(
        node.find('[data-testid="text-location"], .companyLocation').first().text()
      );

      let href = titleEl.attr('href') || node.find('a[data-jk]').attr('href');
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
