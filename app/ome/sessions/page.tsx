import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

export default function OmeSessionsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', margin: '0 0 12px' }}>
          OME Sessions
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', margin: '0 0 24px' }}>
          Coming soon.
        </p>
        <Link href="/dashboard" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--teal-dark)', textDecoration: 'none', borderBottom: '1px solid var(--teal-soft)', paddingBottom: 2 }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
