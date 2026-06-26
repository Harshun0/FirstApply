import * as cheerio from 'cheerio';
import { fetchHtml, makeJobId, absoluteUrl, clean } from './_helpers.js';

const SOURCE = 'unstop';
const BASE = 'https://unstop.com';
const URL =
  'https://unstop.com/jobs?filters=eyJhcHBsaWNhbnRUeXBlIjpbImZyZXNoZXIiXX0%3D';
// Unstop's listing API backs the SPA; try it first, fall back to HTML scraping.
// NOTE: empty filters=/searchTerm= params make the endpoint return nothing, so
// we pass only the params that matter.
const API = 'https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&per_page=30&applicantType=fresher';

export async function scrapeJobs() {
  // Unstop is an Angular SPA — the HTML page has no listings until JS runs.
  // The public search API returns JSON, so prefer it.
  try {
    const data = await fetchHtml(API, { headers: { Accept: 'application/json' } });
    const list = parseApi(data);
    if (list.length) {
      console.log(`[${SOURCE}] scraped ${list.length} jobs (api)`);
      return list;
    }
  } catch (err) {
    console.error(`[${SOURCE}] api failed, trying html:`, err.message);
  }

  // HTML fallback (best-effort; usually empty for SPAs without a headless browser).
  try {
    const html = await fetchHtml(URL);
    const $ = cheerio.load(html);
    const jobs = [];

    $('app-competition-listing, .opportunity-cards, .single_profile, .cont a').each((_, el) => {
      const node = $(el);
      const title = clean(node.find('h2, .double-line, .title').first().text());
      const company = clean(node.find('.organisation, .user_name, .org-name').first().text());
      const location = clean(node.find('.location, .seperate_box').first().text());
      const href = node.find('a').first().attr('href') || node.attr('href');
      if (!title) return;
      jobs.push({
        title,
        company,
        location,
        experience: 'fresher',
        applyLink: absoluteUrl(href || URL, BASE),
        source: SOURCE,
        jobId: makeJobId(title, company, SOURCE),
      });
    });

    console.log(`[${SOURCE}] scraped ${jobs.length} jobs (html)`);
    return jobs;
  } catch (err) {
    console.error(`[${SOURCE}] scrape failed:`, err.message);
    return [];
  }
}

function parseApi(data) {
  // Accept either a parsed object or a JSON string.
  let payload = data;
  if (typeof data === 'string') {
    try {
      payload = JSON.parse(data);
    } catch {
      return [];
    }
  }
  const items = payload?.data?.data || payload?.data || [];
  if (!Array.isArray(items)) return [];

  return items
    .map((it) => {
      const title = clean(it.title);
      const company = clean(it.organisation?.name || it.organisationName || '');
      const locs = it.jobDetail?.locations;
      const location = clean(
        (Array.isArray(locs) ? locs.join(', ') : locs) || it.region || it.location || ''
      );
      const slug = it.seo_url || it.public_url || it.slug;
      if (!title) return null;
      return {
        title,
        company,
        location,
        experience: 'fresher',
        applyLink: slug ? absoluteUrl(slug, BASE) : URL,
        source: SOURCE,
        jobId: makeJobId(title, company, SOURCE),
      };
    })
    .filter(Boolean);
}

export default scrapeJobs;
