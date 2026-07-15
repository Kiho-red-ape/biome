'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

function PartnerLogo({ partner }: { partner: Partner }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width:   90,
        height:  90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter:  hover ? 'grayscale(0) opacity(1)' : 'grayscale(1) opacity(0.5)',
        transition: 'filter 200ms ease',
      }}
    >
      <Image src={partner.logo_url} alt={partner.name} width={90} height={90} style={{ objectFit: 'contain' }} />
    </div>
  );
}

export function PartnersStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <span className="section-label" style={{ marginBottom: 40, display: 'block' }}>Partners</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, marginBottom: 32 }}>
          {partners.map(p => <PartnerLogo key={p.id} partner={p} />)}
        </div>
        <a
          href="/partners/join"
          style={{
            fontFamily:  'var(--font-display)',
            fontSize:    14,
            fontWeight:  600,
            color:       'var(--slate)',
            borderBottom: '2px solid var(--border-mid)',
            paddingBottom: 2,
            transition:  'color 150ms, border-color 150ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--teal)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--teal)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--slate)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-mid)';
          }}
        >
          Interested in partnering? →
        </a>
      </div>
    </section>
  );
}
