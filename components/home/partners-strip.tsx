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
        width:      80,
        height:     80,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter:     hover ? 'grayscale(0) opacity(1)' : 'grayscale(1) opacity(0.5)',
        transition: 'filter 200ms ease',
        flexShrink: 0,
      }}
    >
      <Image
        src={partner.logo_url}
        alt={partner.name}
        width={80}
        height={80}
        style={{ objectFit: 'contain', maxWidth: 80, maxHeight: 80 }}
      />
    </div>
  );
}

export function PartnersStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <section
      style={{ paddingTop: 0, paddingBottom: 96, maxWidth: 900, margin: '0 auto' }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
        color: '#b7ff61', textTransform: 'uppercase', marginBottom: 40,
        textAlign: 'center',
      }}>
        // PARTNERS
      </p>

      <div style={{
        display:        'flex',
        flexWrap:       'wrap',
        justifyContent: 'center',
        gap:            32,
        marginBottom:   24,
      }}>
        {partners.map((p) => (
          <PartnerLogo key={p.id} partner={p} />
        ))}
      </div>

      <p style={{ textAlign: 'center' }}>
        <a
          href="/partners/join"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: '#4a6050', textDecoration: 'none',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = '#b7ff61'; }}
          onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = '#4a6050'; }}
        >
          Interested in partnering? Learn more →
        </a>
      </p>
    </section>
  );
}
