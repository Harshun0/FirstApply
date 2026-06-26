import cron from 'node-cron';

import Job from '../models/Job.js';
import User from '../models/User.js';
import { matchesUser } from './filter.js';
import { sendAlert } from './notifier.js';

import scrapeFreshershunt from '../scrapers/freshershunt.js';
import scrapeInternshala from '../scrapers/internshala.js';
import scrapeUnstop from '../scrapers/unstop.js';
import scrapeNaukri from '../scrapers/naukri.js';
import scrapeIndeed from '../scrapers/indeed.js';
import scrapeWellfound from '../scrapers/wellfound.js';

const SCRAPERS = [
  scrapeFreshershunt,
  scrapeInternshala,
  scrapeUnstop,
  scrapeNaukri,
  scrapeIndeed,
  scrapeWellfound,
];

let isRunning = false;

export async function runScrapeCycle() {
  // Guard against overlapping runs if a cycle takes longer than the interval.
  if (isRunning) {
    console.log('⏳ Previous scrape cycle still running — skipping this tick');
    return;
  }
  isRunning = true;

  let newJobCount = 0;
  let alertCount = 0;

  try {
    // 1. Run all scrapers in parallel; a failing scraper never breaks the cycle.
    const settled = await Promise.allSettled(SCRAPERS.map((fn) => fn()));

    const jobs = [];
    settled.forEach((result, i) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        jobs.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`❌ Scraper #${i} rejected:`, result.reason?.message || result.reason);
      }
    });

    // 2. Load active users once per cycle rather than per job.
    const activeUsers = await User.find({ isActive: true });

    // 3. Process each scraped job.
    for (const job of jobs) {
      if (!job || !job.jobId || !job.title) continue;

      // a. De-dupe against what we've already seen.
      const exists = await Job.exists({ jobId: job.jobId });
      if (exists) continue;

      // b. Persist the new job.
      try {
        await Job.create({
          jobId: job.jobId,
          title: job.title,
          company: job.company || '',
          location: job.location || '',
          experience: job.experience || '',
          applyLink: job.applyLink || '',
          source: job.source || '',
          postedAt: job.postedAt || new Date(),
        });
      } catch (err) {
        // Likely a duplicate-key race between scrapers; safe to skip.
        if (err.code !== 11000) {
          console.error('❌ Failed to save job:', err.message);
        }
        continue;
      }
      newJobCount += 1;

      // c + d. Notify every matching active user.
      for (const user of activeUsers) {
        if (matchesUser(job, user)) {
          const sent = await sendAlert(user.telegramChatId, job);
          if (sent) alertCount += 1;
        }
      }
    }

    console.log(`✅ Scraped ${newJobCount} new jobs, sent ${alertCount} alerts`);
  } catch (err) {
    console.error('❌ Scrape cycle error:', err.message);
  } finally {
    isRunning = false;
  }
}

export function startScheduler() {
  // Every 2 minutes.
  cron.schedule('*/2 * * * *', runScrapeCycle);
  console.log('⏰ Scheduler started — running every 2 minutes');

  // Kick off an initial run shortly after boot so we don't wait 2 min.
  setTimeout(() => {
    runScrapeCycle().catch((e) => console.error('Initial scrape failed:', e.message));
  }, 5000);
}

export default startScheduler;
