import { DocsSidebar } from './docs-sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-8 sm:gap-12 items-start"
        style={{ paddingTop: 48, paddingBottom: 80 }}>
        {/* Sidebar — sticky on desktop, stacked on mobile */}
        <div className="w-full sm:w-auto sm:sticky" style={{ top: 48 }}>
          <DocsSidebar />
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'clamp(24px, 5vw, 48px)',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
