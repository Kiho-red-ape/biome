import { DocsSidebar } from './docs-sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '48px 24px 80px',
        display: 'flex',
        gap: 60,
        alignItems: 'flex-start',
      }}>
        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 48 }}>
          <DocsSidebar />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
