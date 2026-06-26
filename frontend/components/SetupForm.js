'use client';

import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'YourBotName';

const ROLE_OPTIONS = [
  'Full Stack', 'Frontend', 'Backend', 'React', 'Node.js',
  'MERN', 'Python', 'Java', 'Data Analyst', 'DevOps',
];
const LOCATION_OPTIONS = [
  'Remote', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad',
  'Delhi', 'Chennai', 'Anywhere in India',
];
const EXPERIENCE_OPTIONS = ['Fresher', '0-1 Years', 'Intern', 'Entry Level'];

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

const C = {
  bg:       'var(--background-color)',
  card:     '#0F0F1A', // This can remain as is if it's a specific shade for cards
  accent:   'var(--primary-orange)',
  text:     'var(--text-color)',
  muted:    'var(--secondary-text)',
  subtle:   '#9B9BAB', // Can remain as is if it's a specific shade
  border:   'rgba(255,255,255,0.07)',
  borderMd: 'rgba(255,255,255,0.1)',
};

const S = {
  card: {
    background: C.card,
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '32px',
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    background: C.border,
    margin: '24px 0',
  },
  btnPrimary: {
    background: C.accent,
    color: '#000',
    fontWeight: 700,
    fontSize: 14,
    padding: '12px 28px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '-0.2px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  btnGhost: {
    background: 'transparent',
    color: C.muted,
    fontSize: 14,
    padding: '12px 20px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  summaryRow: {
    background: 'rgba(8,8,15,0.5)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '12px 16px',
  },
};

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border text-sm px-3.5 py-1.5 font-sans cursor-pointer
        ${selected
          ? 'border-primary bg-orange-light text-primary font-semibold'
          : 'border-borderMd bg-background text-subtle font-normal'
        }`}
    >
      {label}
    </button>
  );
}

function Stepper({ step }) {
  const labels = ['Preferences', 'Connect'];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${active
                ? 'bg-primary text-black'
                : done
                  ? 'bg-orange-lighter text-primary'
                  : 'bg-gray-code text-muted border border-borderMd'
              }`}
            >
              {done ? '✓' : n}
            </div>
            <span className={`${active ? 'text-text' : 'text-muted'} text-sm`}>
              {label}
            </span>
            {n < labels.length && (
              <div className="w-10 h-px bg-border mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Summary({ label, values }) {
  return (
    <div className="bg-background/50 border border-border rounded-lg p-3">
      <div className="text-xs tracking-wider uppercase text-muted mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.filter(Boolean).map((v) => (
          <span key={v} className="bg-gray-code border border-border rounded px-2.5 py-1 text-sm text-text">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SetupForm() {
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [experience, setExperience] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const toggle = (value, list, setList) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const canProceed = roles.length > 0;

  async function handleConnect() {
    setStatus('connecting');
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/start-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            roles: roles.map((r) => r.toLowerCase()),
            locations: locations.map((l) => l.toLowerCase()),
            experience: experience.map((e) => e.toLowerCase()),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not start. Is the backend running?');
      }
      const link = data.deepLink || `https://t.me/${BOT_USERNAME}?start=${data.token}`;
      setDeepLink(link);
      window.open(link, '_blank');
      setStatus('waiting');
      startPolling(data.token);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  function startPolling(token) {
    const startedAt = Date.now();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(pollRef.current);
        setStatus('error');
        setError('Timed out waiting for Telegram. Please try again.');
        return;
      }
      try {
        const r = await fetch(`${API_URL}/api/auth/poll/${token}`);
        const d = await r.json().catch(() => ({}));
        if (d.status === 'completed') {
          clearInterval(pollRef.current);
          setStatus('done');
        } else if (r.status === 404 || d.status === 'expired') {
          clearInterval(pollRef.current);
          setStatus('error');
          setError('Your setup link expired. Please try again.');
        }
      } catch {
        /* keep polling */
      }
    }, POLL_INTERVAL_MS);
  }

  function reset() {
    clearInterval(pollRef.current);
    setStatus('idle');
    setError('');
    setDeepLink('');
    setStep(2);
  }

  if (status === 'done') {
    return (
      <div className="bg-card border border-orange-lighter rounded-2xl p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold tracking-tight mt-4 mb-2 text-text">
          You&apos;re all set!
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Check Telegram for your confirmation message. Matching fresher jobs will start arriving in your DMs.
        </p>
        <p className="mt-6 text-xs text-gray-tip">
          Tip: send{' '}
          <code className="bg-gray-code border border-border rounded px-1.5 py-0.5 text-xs text-subtle">
            /status
          </code>{' '}
          to the bot anytime to review your filters.
        </p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin mx-auto" />
        <h2 className="text-xl font-bold tracking-tight mt-6 mb-2 text-text">
          Waiting for Telegram…
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto mb-6">
          Telegram should have opened. Tap{' '}
          <span className="text-primary font-semibold">START</span>{' '}
          in your chat with{' '}
          <span className="text-text font-semibold">@{BOT_USERNAME}</span>{' '}
          to finish.
        </p>
        <button
          type="button"
          onClick={() => window.open(deepLink, '_blank')}
          className="bg-primary text-black font-bold text-sm px-7 py-3 rounded-lg no-underline tracking-tighter cursor-pointer font-sans"
        >
          Open Telegram
        </button>
        <p className="mt-4 text-xs text-gray-tip">
          Didn&apos;t open? Use the button above. This page updates automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <Stepper step={step} />

      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-1.5 text-text">
            Job preferences
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-7">
            We&apos;ll connect Telegram in one tap on the next step — no Chat ID needed.
          </p>

          <p className="text-xs tracking-wider uppercase text-muted mb-2">
            Roles{' '}
            <span className="tracking-normal normal-case text-gray-tip">
              (pick at least one)
            </span>
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {ROLE_OPTIONS.map((r) => (
              <Chip key={r} label={r} selected={roles.includes(r)} onClick={() => toggle(r, roles, setRoles)} />
            ))}
          </div>

          <div className="h-px bg-border my-6" />

          <p className="text-xs tracking-wider uppercase text-muted mb-2">Locations</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {LOCATION_OPTIONS.map((l) => (
              <Chip key={l} label={l} selected={locations.includes(l)} onClick={() => toggle(l, locations, setLocations)} />
            ))}
          </div>

          <div className="h-px bg-border my-6" />

          <p className="text-xs tracking-wider uppercase text-muted mb-2">Experience</p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_OPTIONS.map((e) => (
              <Chip key={e} label={e} selected={experience.includes(e)} onClick={() => toggle(e, experience, setExperience)} />
            ))}
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => setStep(2)}
              className={`bg-primary text-black font-bold text-sm px-7 py-3 rounded-lg border-none tracking-tighter font-sans
                ${!canProceed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-1.5 text-text">
            Review &amp; connect
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Everything look right? We&apos;ll open Telegram and you just tap{' '}
            <span className="text-primary font-semibold">START</span>.
          </p>

          <div className="flex flex-col gap-2.5 mb-5">
            <Summary label="Roles" values={roles} />
            <Summary label="Locations" values={locations.length ? locations : ['Any']} />
            <Summary label="Experience" values={experience.length ? experience : ['Any']} />
          </div>

          <div className="bg-background/50 border border-border rounded-lg p-3 text-sm text-muted leading-relaxed">
            Next, we&apos;ll open Telegram and you just tap{' '}
            <span className="text-primary font-semibold">START</span> with{' '}
            <span className="text-text font-semibold">@{BOT_USERNAME}</span>.
            That&apos;s it — we read your chat automatically.
          </div>

          {error && (
            <div className="mt-4 bg-red-900/[0.08] border border-red-900/25 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={status === 'connecting'}
              className={`bg-transparent text-muted text-sm px-5 py-3 rounded-lg border border-borderMd font-sans
                ${status === 'connecting' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={status === 'connecting'}
              className={`bg-primary text-black font-bold text-sm px-7 py-3 rounded-lg border-none tracking-tighter font-sans
                ${status === 'connecting' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {status === 'connecting' ? 'Opening Telegram…' : 'Connect Telegram →'}
            </button>
          </div>

          {status === 'error' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={reset}
                className="bg-none border-none text-primary text-sm cursor-pointer underline font-sans"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
