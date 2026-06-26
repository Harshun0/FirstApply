import Link from 'next/link';
import SetupForm from '../../components/SetupForm';

export const metadata = {
  title: 'Set Up Your Alerts — FirstApply',
};

export default function SetupPage() {
  return (
    <main style={{ background: 'var(--background-color)', color: 'var(--text-color)', minHeight: '100vh' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--primary-orange)' }}>First</span>Apply
        </Link>
        <Link href="/" style={{ fontSize: 13, color: 'var(--secondary-text)', textDecoration: 'none' }}>
          ← Back home
        </Link>
      </header>

      <section style={{ maxWidth: 780, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <SetupForm />
      </section>
    </main>
  );
}
