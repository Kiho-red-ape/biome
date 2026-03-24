import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

const DOCS = [
  { key: 'tos',                    href: '/legal/tos',                    title: 'Platform Terms of Service',   desc: 'Governs your use of the BIOME platform.'           },
  { key: 'participant-agreement',  href: '/legal/participant-agreement',  title: 'Participant Study Agreement', desc: 'Governs your participation in experiments.'        },
  { key: 'experimenter-agreement', href: '/legal/experimenter-agreement', title: 'Experimenter Study Agreement',desc: 'Governs posting and managing experiments on BIOME.'},
];

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-8 py-12">
        <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// LEGAL_DOCUMENTS</p>
        <h1 className="text-2xl font-black mb-8" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}>
          Legal
        </h1>
        <div className="flex flex-col gap-3">
          {DOCS.map((d) => (
            <Link
              key={d.key}
              href={d.href}
              className="no-underline flex items-center justify-between px-4 py-4 rounded transition-all hover:opacity-90"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-white)' }}>{d.title}</p>
                <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{d.desc}</p>
              </div>
              <span className="mono text-xs ml-4" style={{ color: 'var(--green)' }}>READ →</span>
            </Link>
          ))}
        </div>
        <p className="mono text-xs mt-8" style={{ color: 'var(--text-dim)' }}>
          Governing law: India · Arbitration: Bengaluru, Karnataka · No class action
        </p>
      </div>
      <footer className="text-center py-4 mono text-xs" style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}>
        // BIOME_PROTOCOL — legal@biome.to
      </footer>
    </main>
  );
}
