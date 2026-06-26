# 🚨 FirstApply

Get **fresher job alerts on Telegram — instantly**. FirstApply scrapes 6+ job
sites every 2 minutes, matches new listings against your filters, and DMs them
to you on Telegram.

- **Backend:** Node.js + Express (deploy on Render)
- **Frontend:** Next.js + Tailwind CSS (deploy on Vercel)
- **Database:** MongoDB Atlas (Mongoose)
- **Notifications:** Telegram Bot API (`node-telegram-bot-api`)
- **Scraping:** Axios + Cheerio, with Puppeteer (headless Chromium) for JS-rendered sites
- **Sources:** FreshersHunt · Internshala · Unstop · Naukri · Indeed · Wellfound

---

## 📁 Project structure

```
fresher-alert/
├── backend/
│   ├── src/
│   │   ├── config/        # db + telegram bot singletons
│   │   ├── scrapers/      # one file per source + shared _helpers
│   │   ├── models/        # User, Job (Mongoose)
│   │   ├── routes/        # user API
│   │   ├── services/      # filter, notifier, scheduler
│   │   └── index.js       # express app + bot commands + boot
│   ├── render.yaml
│   └── package.json
├── frontend/
│   ├── app/               # landing (/) + setup (/setup)
│   ├── components/SetupForm.js
│   └── package.json
└── README.md
```

---

## 🔑 Environment variables

### `backend/.env`

| Variable             | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `PORT`               | Server port (default `5000`; Render injects its own).              |
| `MONGODB_URI`        | MongoDB Atlas connection string.                                   |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather).               |
| `FRONTEND_URL`       | Deployed frontend URL (used in `/start` message + CORS allowlist). |

### `frontend/.env.local`

| Variable                   | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`      | Base URL of the backend (no trailing slash).      |
| `NEXT_PUBLIC_BOT_USERNAME` | Your bot's `@username`, shown in setup steps.     |

---

## 🤖 Getting a Telegram bot token

1. Open Telegram and message **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot`, choose a name and a username (must end in `bot`).
3. BotFather replies with a token like `123456789:ABC-DEF...` → this is your
   `TELEGRAM_BOT_TOKEN`.
4. Users find their **Chat ID** by messaging **@userinfobot**.

---

## 🚀 Local development

### Backend

```bash
cd backend
cp .env.example .env      # then fill in real values
npm install
npm run dev               # nodemon on http://localhost:5000
```

Health check: <http://localhost:5000/api/health>

### Frontend

```bash
cd frontend
npm install
# .env.local already points at http://localhost:5000
npm run dev               # http://localhost:3000
```

---

## ☁️ Deploy the backend on Render

1. Push this repo to GitHub.
2. On [Render](https://render.com) → **New → Blueprint**, point it at the repo.
   It reads `backend/render.yaml` automatically. _(Or create a **Web Service**
   manually: root dir `backend`, build `npm install`, start `npm start`.)_
3. Add the env vars `MONGODB_URI`, `TELEGRAM_BOT_TOKEN`, `FRONTEND_URL`
   (PORT is preset).
4. Deploy. Your API will be at `https://<service>.onrender.com`.

> ⚠️ **Render free tier sleeps after inactivity.** When asleep the 2-minute
> cron pauses too. Keep it warm with a free uptime pinger (e.g. UptimeRobot)
> hitting `/api/health`, or use a paid instance for 24/7 scraping.

---

## ▲ Deploy the frontend on Vercel

1. On [Vercel](https://vercel.com) → **Add New → Project** → import the repo.
2. Set **Root Directory** to `frontend`.
3. Add env vars:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL
   - `NEXT_PUBLIC_BOT_USERNAME` → your bot username
4. Deploy, then set the resulting URL as `FRONTEND_URL` on Render and redeploy
   the backend (so CORS + the `/start` message use it).

---

## 🧭 How it works

### One-tap onboarding (deep link)

There's **no Chat ID to copy** — Telegram bots can't message users by phone
number or username, only by `chat_id`, and only after the user taps **Start**.
So onboarding uses a deep link:

1. On `/setup`, the user picks filters and clicks **Connect Telegram**.
2. The site calls `POST /api/auth/start-token`, which stores a short-lived
   `PendingSession` (token + filters, 15-min TTL) and returns a deep link:
   `https://t.me/<bot>?start=<token>`.
3. The browser opens that link; the user taps **Start**. The bot receives
   `/start <token>`, looks up the session, **upserts the user with the stored
   filters and the chat ID it now knows**, marks the session `completed`, and
   DMs a confirmation.
4. The site polls `GET /api/auth/poll/:token` and flips to "🎉 You're all set!".

### Alert pipeline

1. **Scheduler** (`node-cron`, every 2 min) runs all 6 scrapers in parallel
   with `Promise.allSettled` — a failing scraper never breaks the cycle.
2. Each job gets a deterministic `jobId = md5(title + company + source)`. Jobs
   already in MongoDB are skipped; new ones are saved.
3. For every new job, each **active user** is checked with `matchesUser()`
   (role + location + experience). Matches are DM'd via the Telegram bot.
4. A **TTL index** auto-deletes job docs after 7 days so the collection stays small.

### Bot commands

| Command         | Action                                                |
| --------------- | ----------------------------------------------------- |
| `/start <token>`| Completes website setup (auto-register) when a token. |
| `/start`        | Generic welcome.                                      |
| `/status`       | Shows current filters and active state.               |
| `/stop`         | Pauses alerts (`isActive = false`).                   |
| `/help`         | Lists commands.                                       |

### API endpoints

| Method   | Route                     | Purpose                                  |
| -------- | ------------------------- | ---------------------------------------- |
| `POST`   | `/api/auth/start-token`   | Create a setup session, return deep link.|
| `GET`    | `/api/auth/poll/:token`   | Poll setup status (`pending`/`completed`).|
| `POST`   | `/api/users/register`     | Direct upsert (used by API/testing).     |
| `GET`    | `/api/users/:chatId`      | Fetch a user's filters.                  |
| `PUT`    | `/api/users/:chatId`      | Update filters.                          |
| `DELETE` | `/api/users/:chatId`      | Pause alerts (soft delete).              |
| `GET`    | `/api/health`             | `{ status, uptime }`.                    |

---

## ⚠️ A note on scraping

**Current scraper status** (~217 jobs/cycle; boards change often — re-verify periodically):

| Source        | Method                       | Status                                  |
| ------------- | ---------------------------- | --------------------------------------- |
| Internshala   | HTML (Axios + Cheerio)       | ✅ Working (~100 jobs/cycle)            |
| Naukri        | **Puppeteer** (headless)     | ✅ Working (~45 jobs/cycle)             |
| Indeed        | **Puppeteer** (headless)     | ✅ Working (~32 jobs/cycle)             |
| Unstop        | Public JSON API              | ✅ Working (~30 jobs/cycle)             |
| FreshersHunt  | HTML (WP archive)            | ✅ Working (~10 jobs/cycle)             |
| Wellfound     | Puppeteer                    | ⛔ Blocked by DataDome CAPTCHA          |

**Wellfound** sits behind [DataDome](https://datadome.co/), a commercial CAPTCHA
wall. Headless Chromium alone can't pass it — you'd need a **residential proxy +
CAPTCHA-solving service**. The scraper detects the wall and returns `[]` cleanly;
the parsing selectors are in place for if you add a proxy via
`PUPPETEER_EXECUTABLE_PATH` / launch args in `src/scrapers/_browser.js`.

Job boards change their HTML often. The scrapers use resilient multi-selector
parsing and **return `[]` on failure instead of crashing**, so a broken source
never takes down the scheduler. Expect to:

- **Update CSS selectors** when a site changes its markup (each scraper is a
  self-contained file).
- **Respect each site's Terms of Service and `robots.txt`**, throttle politely
  (a 1s delay is built into the shared fetch helper), and only run this for
  personal use.

### 🧭 Puppeteer on Render

Naukri and Indeed use a shared headless Chromium (`src/scrapers/_browser.js`,
one reused instance). For this to work on Render:

- `render.yaml` runs `npx puppeteer browsers install chrome` at build time and
  sets `PUPPETEER_CACHE_DIR` so the downloaded Chromium is found at runtime
  (`.puppeteerrc.cjs` pins the cache into the project dir).
- **Memory:** Chromium is heavy. The Render **free tier (512 MB) may OOM** when
  Chromium runs alongside Node. Use the **Starter ($7) instance** for reliable
  headless scraping. If Chromium fails to launch, those two scrapers just return
  `[]` and the other four keep working — the app stays up.
- To run **without** Puppeteer (lighter, 4 working sources), revert `naukri.js`
  and `indeed.js` to plain Axios — they'll return `[]` but won't crash.

The architecture (scheduler → de-dupe → filter → notify) is the real product;
swapping or fixing an individual scraper is a self-contained change in
`backend/src/scrapers/`.

---

## 📜 License

MIT — open source. PRs welcome.
