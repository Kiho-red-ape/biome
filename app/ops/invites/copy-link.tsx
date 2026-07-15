'use client';

import { useState } from 'react';

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: copied ? '#15803d' : 'var(--slate)',
        background: 'var(--surface)', border: '1px solid var(--border-mid)', borderRadius: 6,
        padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
