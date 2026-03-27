import { DocsSidebar } from './docs-sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-8 sm:gap-16 items-start"
        style={{ paddingTop: 48, paddingBottom: 80 }}>
        {/* Sidebar — sticky on desktop, stacked on mobile */}
        <div className="w-full sm:w-auto sm:sticky" style={{ top: 48 }}>
          <DocsSidebar />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
