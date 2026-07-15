// Versioned consent texts for the participant data hub. Each grant stores the
// version + SHA-256 hash of the exact text agreed to, so consent is auditable.
// Principles encoded (GDPR / India DPDPA aligned): specific + informed + freely
// given, purpose-limited, withdrawable at any time, pseudonymised by default.

import { createHash } from 'crypto';

export type ConsentScope = 'metadata_sync' | 'health_reports' | 'digital_twin_research';

export const CONSENT_VERSION = 'v1';

export const CONSENT_TEXTS: Record<ConsentScope, { title: string; text: string }> = {
  metadata_sync: {
    title: 'Sync lifestyle & device metrics',
    text:
      'I agree that BIOME may store the lifestyle and device metrics I choose to sync ' +
      '(for example sleep, steps, heart rate, weight) as a time-stamped record linked to my ' +
      'pseudonymous participant ID — not my real-world identity. This data is used only to ' +
      'build my longitudinal health record on BIOME and to check my fit for studies I choose ' +
      'to apply to. It is never sold, and never shared with a study sponsor without a separate, ' +
      'explicit consent for that study. I can stop syncing and withdraw this consent at any ' +
      'time, and ask for my synced data to be deleted.',
  },
  health_reports: {
    title: 'Store uploaded health reports',
    text:
      'I agree that BIOME may store health documents I upload (for example lab panels or ' +
      'imaging reports) in encrypted storage, linked to my pseudonymous participant ID. ' +
      'Documents are visible only to me and to BIOME operations staff for verification. ' +
      'They are never shared with a study sponsor without a separate, explicit consent for ' +
      'that study. I can delete any document, or withdraw this consent entirely, at any time.',
  },
  digital_twin_research: {
    title: 'Use my pseudonymised record for research matching',
    text:
      'I agree that BIOME may use my pseudonymised longitudinal record (synced metrics and ' +
      'report metadata — not raw documents) to match me to relevant studies and to show me ' +
      'insights about my own data. Any use in an actual study still requires my separate, ' +
      'study-specific informed consent. I can withdraw this consent at any time without ' +
      'affecting my participation in anything I have already joined.',
  },
};

export function consentHash(scope: ConsentScope): string {
  return createHash('sha256').update(CONSENT_TEXTS[scope].text).digest('hex');
}

export const CONSENT_SCOPES: ConsentScope[] = ['metadata_sync', 'health_reports', 'digital_twin_research'];
