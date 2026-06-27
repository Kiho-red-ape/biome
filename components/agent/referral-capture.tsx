'use client';

import { useEffect } from 'react';

// Persists a ?ref=CODE from any landing URL into localStorage so the referral
// survives the Privy signup flow. The /welcome page claims it after auth.
// (Attribution only; no compensation language anywhere in the referral path.)
export function ReferralCapture() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get('ref');
      if (code && /^[A-Za-z0-9]{4,12}$/.test(code)) {
        window.localStorage.setItem('biome_ref', code.toUpperCase());
      }
    } catch {
      /* no-op — storage unavailable */
    }
  }, []);

  return null;
}
