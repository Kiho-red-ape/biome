export type BountyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export function getBountyTier(amount: number): BountyTier {
  if (amount < 50)  return 'bronze';
  if (amount < 150) return 'silver';
  if (amount < 250) return 'gold';
  return 'platinum';
}

export function getTierLabel(tier: BountyTier): string {
  const labels: Record<BountyTier, string> = {
    bronze:   '$ Bronze',
    silver:   '$$ Silver',
    gold:     '$$$ Gold',
    platinum: '$$$$ Platinum',
  };
  return labels[tier];
}

export function getTierColor(tier: BountyTier): string {
  const colors: Record<BountyTier, string> = {
    bronze:   '#cd7f32',
    silver:   '#aab8b1',
    gold:     '#fbbf24',
    platinum: '#22d3ee',
  };
  return colors[tier];
}

export function getTierRange(tier: BountyTier): string {
  const ranges: Record<BountyTier, string> = {
    bronze:   'Under $50 per participant',
    silver:   '$50 – $150 per participant',
    gold:     '$150 – $250 per participant',
    platinum: '$250+ per participant',
  };
  return ranges[tier];
}
