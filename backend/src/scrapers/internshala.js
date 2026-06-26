import * as cheerio from 'cheerio';
import { fetchHtml, makeJobId, absoluteUrl, clean } from './_helpers.js';

const SOURCE = 'internshala';
const BASE = 'https://internshala.com';
const URL = 'https://internshala.com/jobs/computer-science-jobs';

export async function scrapeJobs() {
  try {
    const html = await fetchHtml(URL);
    const $ = cheerio.load(html);
    const jobs = [];

    // Internshala renders job cards server-side as .individual_internship /
    // .internship_meta blocks with a data-href to the detail page.
    const cards = $(
      '.individual_internship, .internship_meta, [internshipid], .container-fluid.individual_internship'
    ).toArray();

    for (const el of cards) {
      const node = $(el);
      const title = clean(
        node.find('.job-internship-name, .profile, h3.heading_4_5 a, .heading_4_5').first().text()
      );
      const company = clean(
        node.find('.company-name, .company_name, .heading_6.company_name, p.company-name').first().text()
      );
      const location = clean(
        node.find('.locations a, .location_link, .row-1-item.locations span, #location_names').first().text()
      );
      const salary = clean(
        node.find('.stipend, .salary, .row-1-item.stipend').first().text()
      );

      let href =
        node.attr('data-href') ||
        node.find('a.job-title-href, a.view_detail_button, .job-internship-name a, h3 a').first().attr('href');

      if (!title) continue;

      jobs.push({
        title,
        company,
        location,
        // Internshala fresher jobs rarely state experience; keep salary as a hint.
        experience: salary ? `fresher (${salary})` : 'fresher',
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
