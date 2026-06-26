import Link from 'next/link';

const FEATURES = [
  { icon: '⚡', title: 'Real-time alerts', desc: 'New jobs delivered every 2 minutes.' },
  { icon: '🎯', title: 'Smart filters', desc: 'Filter by role, location, and experience.' },
  { icon: '📱', title: 'Direct Telegram DM', desc: 'Alerts land straight in your chat.' },
  { icon: '🆓', title: '100% Free', desc: 'Open source. No paywalls, no spam.' },
];

const SOURCES = [
  'FreshersHunt',
  'Internshala',
  'Unstop',
  'Naukri',
  'Indeed',
  'Wellfound',
];

const GITHUB_URL = 'https://github.com/your-username/fresher-alert';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-bold">
          <span className="text-accent">Fresher</span>Alert
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-slate-400 transition hover:text-accent"
        >
          GitHub ↗
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-medium text-accent">
          🚀 6+ sources · scraped every 2 minutes
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Get Fresher Job Alerts on{' '}
          <span className="text-accent">Telegram</span> — Instantly
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          We scrape 6+ job sites every 2 minutes so you apply first. No
          dashboards to check — alerts come straight to your DMs.
        </p>
        <div className="mt-10">
          <Link
            href="/setup"
            className="inline-block rounded-xl bg-accent px-8 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-accent/20 transition hover:bg-green-400"
          >
            Set Up My Alerts →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-accent/40"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section className="mx-auto max-w-6xl px-6 py-12 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Sourcing jobs from
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {SOURCES.map((s) => (
            <span
              key={s}
              className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-accent/20 bg-gradient-to-b from-accent/10 to-transparent p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to never miss a fresher job again?
          </h2>
          <p className="mt-3 text-slate-400">
            Set up takes under a minute.
          </p>
          <Link
            href="/setup"
            className="mt-8 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-slate-950 transition hover:bg-green-400"
          >
            Set Up My Alerts →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} FresherAlert · MIT licensed</span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-accent">
            ⭐ Star on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}
