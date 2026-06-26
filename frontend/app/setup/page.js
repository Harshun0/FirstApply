import Link from 'next/link';
import SetupForm from '../../components/SetupForm';

export const metadata = {
  title: 'Set Up Your Alerts — FresherAlert',
};

export default function SetupPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-bold">
          <span className="text-accent">Fresher</span>Alert
        </Link>
        <Link href="/" className="text-sm text-slate-400 transition hover:text-accent">
          ← Back home
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-20 pt-4">
        <SetupForm />
      </section>
    </main>
  );
}
