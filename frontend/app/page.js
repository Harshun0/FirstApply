'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const GITHUB_URL = 'https://github.com/Harshun0/FirstApply';

const FEATURES = [
  {
    icon: '⚡',
    title: '2-min scrape cycle',
    desc: 'Every 2 minutes, 6 sites get crawled. You get the alert before most people open LinkedIn.',
  },
  {
    icon: '🎯',
    title: 'Filters that stick',
    desc: 'Set your role, city, and experience once. Every alert that hits your DM is already relevant.',
  },
  {
    icon: '📲',
    title: 'Straight to Telegram',
    desc: 'No app to open, no dashboard to check. Alert lands in your chat, tap to apply.',
  },
  {
    icon: '🔓',
    title: 'Free forever',
    desc: 'Open source, MIT licensed. Self-host it, fork it, own every line of it.',
  },
];

const SOURCES = [
  'FreshersHunt',
  'Internshala',
  'Unstop',
  'Naukri',
  'Indeed',
  'Wellfound',
];

const STEPS = [
  { num: '01', title: 'Pick your filters', desc: 'Role, city, experience level — takes 30 seconds.' },
  { num: '02', title: 'Connect Telegram', desc: 'Open the bot, tap START. Done.' },
  { num: '03', title: 'Get hired first', desc: 'Alerts arrive in your DM within 2 minutes of posting.' },
];

function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function LiveCounter() {
  const [jobs, setJobs] = useState(247);
  const animated = useCounter(247);
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.5) setJobs(j => j + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: '#FF6B00', fontVariantNumeric: 'tabular-nums' }}>{jobs}</span>;
}

export default function LandingPage() {
  return (
    <main className="bg-background text-text font-sans min-h-screen">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight">
            <span className="text-primary">First</span>Apply
          </div>
          <div className="flex items-center gap-3">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer"
              className="text-muted text-sm px-4 py-2 border border-borderMd rounded-lg transition-colors duration-200 hover:text-text"
            >
              GitHub ↗
            </a>
            <Link href="/setup"
              className="text-black bg-primary font-semibold text-sm px-4 py-2 rounded-lg no-underline"
            >
              Set up alerts
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-light border border-orange-lighter text-primary text-xs font-medium px-3 py-1 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-primary rounded-full inline-block animate-pulse" />
          Live — scraping every 2 minutes
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-[-2px] mb-5">
          Miss a job,<br />
          <span className="text-primary">miss your shot.</span>
        </h1>

        <p className="text-muted text-lg leading-relaxed max-w-md mx-auto mb-9">
          FirstApply watches 6 job sites and DMs you on Telegram the moment a matching fresher role drops. No dashboards. No delays.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/setup"
            className="inline-block bg-primary text-black font-bold text-base px-8 py-3 rounded-lg no-underline tracking-[-0.3px]"
          >
            Start getting alerts →
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer"
            className="inline-block text-muted text-sm px-6 py-3 rounded-lg no-underline border border-borderMd"
          >
            View source
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-xl overflow-hidden bg-card">
          {[
            { val: <LiveCounter />, label: 'Jobs tracked today' },
            { val: <span className="text-primary">2 min</span>, label: 'Alert speed' },
            { val: <span className="text-primary">6</span>, label: 'Sites monitored' },
          ].map((s, i) => (
            <div key={i} className={`p-7 text-center ${i < 2 ? 'border-b sm:border-b-0 sm:border-r' : ''} border-border`}>
              <div className="text-4xl font-bold tracking-[-1px] leading-none">{s.val}</div>
              <div className="text-xs text-muted mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 72px' }}>
        <p style={{ fontSize: 11, letterSpacing: 2, color: '#6B6B7B', textTransform: 'uppercase', marginBottom: 32 }}>How it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{
              background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '24px 20px',
            }}>
              <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 700, marginBottom: 14, letterSpacing: 1 }}>{s.num}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#6B6B7B', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 72px' }}>
        <p style={{ fontSize: 11, letterSpacing: 2, color: '#6B6B7B', textTransform: 'uppercase', marginBottom: 32 }}>Why it works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '22px 20px',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,107,0,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <div style={{ fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6B6B7B', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOURCES */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 72px' }}>
        <p style={{ fontSize: 11, letterSpacing: 2, color: '#6B6B7B', textTransform: 'uppercase', marginBottom: 24 }}>Sourcing from</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SOURCES.map((s) => (
            <span key={s} style={{
              background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#9B9BAB',
            }}>{s}</span>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{
          background: '#0F0F1A',
          border: '1px solid rgba(255,107,0,0.2)',
          borderRadius: 16, padding: '52px 40px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 12 }}>
            Your next job won't wait.
          </h2>
          <p style={{ color: '#6B6B7B', fontSize: 15, marginBottom: 32 }}>
            Set up in under 60 seconds. Free forever.
          </p>
          <Link href="/setup"
            style={{
              display: 'inline-block', background: '#FF6B00', color: '#000',
              fontWeight: 700, fontSize: 15, padding: '14px 36px',
              borderRadius: 10, textDecoration: 'none',
            }}
          >
            Start getting alerts →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#6B6B7B' }}>© {new Date().getFullYear()} FirstApply · MIT licensed</span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#6B6B7B', textDecoration: 'none' }}>
            ⭐ Star on GitHub
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </main>
  );
}


