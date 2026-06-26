import * as cheerio from 'cheerio';
import { fetchHtml, makeJobId, absoluteUrl, clean } from './_helpers.js';

const SOURCE = 'freshershunt';
const BASE = 'https://freshershunt.in/';
// The homepage is a static landing page; the actual job feed lives in the
// off-campus-drive category archive (WordPress post grid).
const URL = 'https://freshershunt.in/off-campus-drive-jobs/off-campus-drive/';

export async function scrapeJobs() {
  try {
    const html = await fetchHtml(URL);
    const $ = cheerio.load(html);
    const jobs = [];

    // WordPress archive: each post is an <article> with an .entry-title anchor.
    const cards = $('article, .post, .td-block-span6, .blog-post').toArray();

    for (const el of cards) {
      const node = $(el);
      const titleEl = node.find('.entry-title a, h2.entry-title a, h2 a, h3 a').first();
      const title = clean(titleEl.text());
      const href = titleEl.attr('href');
      if (!title || !href) continue;

      // Titles read like "Accenture Off Campus Drive 2026 | Role | Location".
      // First segment's leading words are the best company hint we have.
      const company = clean(title.split(/[-–|]/)[0].replace(/\b(off campus drive|recruitment|hiring|20\d\d)\b/gi, '')) || '';

      jobs.push({
        title,
        company,
        location: '',
        experience: 'fresher',
        applyLink: absoluteUrl(href, BASE),
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
