import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

export default function FacilitiesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', margin: '0 0 12px' }}>
          Facility Directory
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', margin: '0 0 24px' }}>
          Coming soon. India health facility directory is currently in setup.
        </p>
        <Link href="/ome" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--teal-dark)', textDecoration: 'none', borderBottom: '1px solid var(--teal-soft)', paddingBottom: 2 }}>
          ← Back to OME
        </Link>
      </div>
    </div>
  );
}
