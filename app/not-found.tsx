import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// 404</p>
        <h1 className="text-4xl font-black mb-4"
          style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
          Page not found
        </h1>
        <p className="mono text-sm mb-8" style={{ color: 'var(--text-dim)' }}>
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/"
            className="mono text-xs px-4 py-2.5 rounded font-bold no-underline transition-all hover:opacity-90"
            style={{ background: 'var(--green)', color: '#050709' }}>
            ← Back to BIOME
          </Link>
          <Link href="/experiments"
            className="mono text-xs px-4 py-2.5 rounded no-underline transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)' }}>
            Browse studies
          </Link>
        </div>
      </div>
    </main>
  );
}
