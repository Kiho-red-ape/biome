// ─── Shared helpers used across profile, leaderboard, and dashboard ───────────

export function ageRange(yearOfBirth: number): string {
  const age = new Date().getFullYear() - yearOfBirth;
  if (age >= 60) return '60+';
  const lower = Math.floor(age / 5) * 5;
  return `${lower}–${lower + 5}`;
}

export function reputationBadge(rate: number | null | undefined): {
  label: string;
  color: string;
} {
  if (rate == null) return { label: 'New',         color: 'var(--text-dim)' };
  if (rate >= 95)   return { label: 'Excellent',   color: 'var(--green)'    };
  if (rate >= 80)   return { label: 'Strong',      color: 'var(--cyan)'     };
  return               { label: 'Needs Review', color: 'var(--amber)'   };
}

export function memberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ISO 3166-1 alpha-2 codes for common countries
const CC: Record<string, string> = {
  Afghanistan:'AF', Albania:'AL', Algeria:'DZ', Argentina:'AR', Armenia:'AM',
  Australia:'AU', Austria:'AT', Azerbaijan:'AZ', Bangladesh:'BD', Belarus:'BY',
  Belgium:'BE', Bolivia:'BO', Brazil:'BR', Bulgaria:'BG', Cambodia:'KH',
  Canada:'CA', Chile:'CL', China:'CN', Colombia:'CO', Croatia:'HR',
  Cuba:'CU', 'Czech Republic':'CZ', Denmark:'DK', Ecuador:'EC', Egypt:'EG',
  Ethiopia:'ET', Finland:'FI', France:'FR', Georgia:'GE', Germany:'DE',
  Ghana:'GH', Greece:'GR', Guatemala:'GT', Hungary:'HU', Iceland:'IS',
  India:'IN', Indonesia:'ID', Iran:'IR', Iraq:'IQ', Ireland:'IE',
  Israel:'IL', Italy:'IT', Jamaica:'JM', Japan:'JP', Jordan:'JO',
  Kazakhstan:'KZ', Kenya:'KE', Kuwait:'KW', Laos:'LA', Latvia:'LV',
  Lebanon:'LB', Libya:'LY', Lithuania:'LT', Malaysia:'MY', Mexico:'MX',
  Mongolia:'MN', Morocco:'MA', Myanmar:'MM', Nepal:'NP', Netherlands:'NL',
  'New Zealand':'NZ', Nicaragua:'NI', Nigeria:'NG', 'North Korea':'KP',
  Norway:'NO', Oman:'OM', Pakistan:'PK', Panama:'PA', Paraguay:'PY',
  Peru:'PE', Philippines:'PH', Poland:'PL', Portugal:'PT', Qatar:'QA',
  Romania:'RO', Russia:'RU', Rwanda:'RW', 'Saudi Arabia':'SA', Senegal:'SN',
  Serbia:'RS', Singapore:'SG', Slovakia:'SK', Slovenia:'SI',
  'South Africa':'ZA', 'South Korea':'KR', Spain:'ES', 'Sri Lanka':'LK',
  Sudan:'SD', Sweden:'SE', Switzerland:'CH', Syria:'SY', Taiwan:'TW',
  Tanzania:'TZ', Thailand:'TH', Tunisia:'TN', Turkey:'TR', Uganda:'UG',
  Ukraine:'UA', 'United Arab Emirates':'AE', 'United Kingdom':'GB',
  'United States':'US', Uruguay:'UY', Uzbekistan:'UZ', Venezuela:'VE',
  Vietnam:'VN', Yemen:'YE', Zambia:'ZM', Zimbabwe:'ZW',
};

export function countryFlag(country: string): string {
  const code = CC[country];
  if (!code) return '🌍';
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 0x1f1a5))
    .join('');
}

export const CATEGORY_COLORS: Record<string, string> = {
  Sleep:     'var(--cyan)',
  Energy:    'var(--green)',
  Mood:      'var(--amber)',
  Nutrition: 'var(--green)',
  Focus:     'var(--cyan)',
};
export function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'var(--text-dim)';
}
