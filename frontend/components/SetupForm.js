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

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        selected
          ? 'border-accent bg-accent text-slate-950'
          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-accent/50'
      }`}
    >
      {label}
    </button>
  );
}

function Stepper({ step }) {
  const labels = ['Preferences', 'Connect'];
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                active ? 'bg-accent text-slate-950' : done ? 'bg-accent/30 text-accent' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {done ? '✓' : n}
            </div>
            <span className={`hidden text-sm sm:block ${active ? 'text-slate-100' : 'text-slate-500'}`}>
              {label}
            </span>
            {n < labels.length && <div className="mx-1 h-px w-6 bg-slate-700 sm:w-10" />}
          </div>
        );
      })}
    </div>
  );
}

export default function SetupForm() {
  const [step, setStep] = useState(1); // 1 = preferences, 2 = review/connect
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [experience, setExperience] = useState([]);

  // status: 'idle' | 'connecting' | 'waiting' | 'done' | 'error'
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const pollRef = useRef(null);

  // Clean up any running poll on unmount.
  useEffect(() => () => clearInterval(pollRef.current), []);

  const toggle = (value, list, setList) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

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
      // Open Telegram (new tab / app). May be blocked by popup blocker — we
      // also render a manual link on the waiting screen.
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
        /* transient network error — keep polling until timeout */
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

  // ---- Success ----
  if (status === 'done') {
    return (
      <div className="rounded-3xl border border-accent/30 bg-slate-900/60 p-10 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold">You&apos;re all set!</h2>
        <p className="mt-3 text-slate-400">
          Check Telegram for your confirmation message. Matching fresher jobs
          will start arriving in your DMs.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Tip: send <code className="rounded bg-slate-800 px-1.5 py-0.5">/status</code> to the
          bot anytime to review your filters.
        </p>
      </div>
    );
  }

  // ---- Waiting for the Telegram tap ----
  if (status === 'waiting') {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-accent" />
        <h2 className="mt-6 text-xl font-bold">Waiting for Telegram…</h2>
        <p className="mt-3 text-slate-400">
          Telegram should have opened. Tap{' '}
          <span className="font-semibold text-accent">START</span> in your chat with{' '}
          <span className="font-semibold text-slate-200">@{BOT_USERNAME}</span> to finish.
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-slate-950 transition hover:bg-green-400"
        >
          Open Telegram
        </a>
        <p className="mt-4 text-xs text-slate-600">
          Didn&apos;t open? Use the button above. This page updates automatically.
        </p>
      </div>
    );
  }

  // ---- Form (steps 1 & 2) ----
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-10">
      <Stepper step={step} />

      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold">Job Preferences</h2>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ll connect Telegram in one tap on the next step — no Chat ID needed.
          </p>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300">
              Roles <span className="text-slate-600">(pick at least one)</span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <Chip key={r} label={r} selected={roles.includes(r)} onClick={() => toggle(r, roles, setRoles)} />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300">Locations</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map((l) => (
                <Chip key={l} label={l} selected={locations.includes(l)} onClick={() => toggle(l, locations, setLocations)} />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300">Experience</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((e) => (
                <Chip key={e} label={e} selected={experience.includes(e)} onClick={() => toggle(e, experience, setExperience)} />
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => setStep(2)}
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold">Review &amp; connect</h2>

          <div className="mt-6 space-y-4">
            <Summary label="Roles" values={roles} />
            <Summary label="Locations" values={locations.length ? locations : ['Any']} />
            <Summary label="Experience" values={experience.length ? experience : ['Any']} />
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
            Next, we&apos;ll open Telegram and you just tap{' '}
            <span className="font-semibold text-accent">START</span> with{' '}
            <span className="font-semibold text-slate-200">@{BOT_USERNAME}</span>. That&apos;s it —
            we read your chat automatically.
          </div>

          {error && (
            <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={status === 'connecting'}
              className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={status === 'connecting'}
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-slate-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'connecting' ? 'Opening Telegram…' : 'Connect Telegram →'}
            </button>
          </div>

          {status === 'error' && (
            <div className="mt-4 text-center">
              <button type="button" onClick={reset} className="text-sm text-accent hover:underline">
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Summary({ label, values }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {values.filter(Boolean).map((v) => (
          <span key={v} className="rounded-md bg-slate-800 px-2.5 py-1 text-sm text-slate-200">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
