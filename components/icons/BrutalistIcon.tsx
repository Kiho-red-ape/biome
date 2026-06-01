type IconName =
  | 'recruit'
  | 'collect'
  | 'track'
  | 'pay'
  | 'deliver'
  | 'design'
  | 'approve'
  | 'verify'
  | 'match'
  | 'contribute'
  | 'earn';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function BrutalistIcon({ name, size = 64, color = 'currentColor', strokeWidth = 2.5 }: Props) {
  const props = {
    width:   size,
    height:  size,
    viewBox: '0 0 64 64',
    fill:    'none',
    stroke:  color,
    strokeWidth,
    strokeLinecap:  'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'recruit':
      return (
        <svg {...props}>
          {/* Target/crosshair */}
          <circle cx="32" cy="32" r="20" />
          <circle cx="32" cy="32" r="10" />
          <line x1="32" y1="4"  x2="32" y2="18" />
          <line x1="32" y1="46" x2="32" y2="60" />
          <line x1="4"  y1="32" x2="18" y2="32" />
          <line x1="46" y1="32" x2="60" y2="32" />
          {/* Person dot at center */}
          <circle cx="32" cy="32" r="3" fill={color} stroke="none" />
        </svg>
      );

    case 'collect':
      return (
        <svg {...props}>
          {/* Open box */}
          <polyline points="8,24 8,56 56,56 56,24" />
          <polyline points="4,24 32,10 60,24" />
          <line x1="32" y1="10" x2="32" y2="40" />
          {/* Arrow going into box */}
          <polyline points="24,32 32,40 40,32" />
        </svg>
      );

    case 'track':
      return (
        <svg {...props}>
          {/* Horizontal bars */}
          <line x1="8"  y1="16" x2="44" y2="16" />
          <line x1="8"  y1="28" x2="52" y2="28" />
          <line x1="8"  y1="40" x2="36" y2="40" />
          {/* Checkmark */}
          <polyline points="44,44 50,52 60,36" />
        </svg>
      );

    case 'pay':
      return (
        <svg {...props}>
          {/* Circle with checkmark */}
          <circle cx="32" cy="32" r="24" />
          <polyline points="20,32 28,40 44,24" />
        </svg>
      );

    case 'deliver':
      return (
        <svg {...props}>
          {/* Document */}
          <rect x="12" y="8" width="32" height="42" />
          <line x1="20" y1="20" x2="36" y2="20" />
          <line x1="20" y1="28" x2="36" y2="28" />
          <line x1="20" y1="36" x2="28" y2="36" />
          {/* Download arrow below */}
          <line x1="32" y1="50" x2="32" y2="60" />
          <polyline points="24,55 32,63 40,55" />
        </svg>
      );

    case 'design':
      return (
        <svg {...props}>
          {/* Document/protocol */}
          <rect x="12" y="8" width="32" height="40" />
          <line x1="20" y1="18" x2="36" y2="18" />
          <line x1="20" y1="26" x2="36" y2="26" />
          <line x1="20" y1="34" x2="30" y2="34" />
          {/* Pencil */}
          <line x1="40" y1="44" x2="56" y2="28" />
          <polyline points="40,44 36,56 48,52 40,44" />
        </svg>
      );

    case 'approve':
      return (
        <svg {...props}>
          {/* Stamp/seal */}
          <rect x="12" y="36" width="40" height="14" rx="0" />
          <rect x="20" y="10" width="24" height="28" />
          <line x1="8"  y1="56" x2="56" y2="56" />
          <polyline points="24,24 30,30 40,18" />
        </svg>
      );

    case 'verify':
      return (
        <svg {...props}>
          {/* Shield */}
          <path d="M32 8 L56 18 L56 36 Q56 52 32 58 Q8 52 8 36 L8 18 Z" />
          <polyline points="22,32 29,39 42,25" />
        </svg>
      );

    case 'match':
      return (
        <svg {...props}>
          {/* Bell */}
          <path d="M32 8 Q44 8 44 24 L44 38 L50 44 L14 44 L20 38 L20 24 Q20 8 32 8" />
          <circle cx="32" cy="46" r="5" />
          <line x1="32" y1="44" x2="32" y2="52" />
          <line x1="26" y1="52" x2="38" y2="52" />
          {/* Notification dot */}
          <circle cx="46" cy="14" r="6" fill={color} stroke={color} />
        </svg>
      );

    case 'contribute':
      return (
        <svg {...props}>
          {/* Calendar */}
          <rect x="8" y="14" width="48" height="42" />
          <line x1="8"  y1="26" x2="56" y2="26" />
          <line x1="20" y1="8"  x2="20" y2="20" />
          <line x1="44" y1="8"  x2="44" y2="20" />
          {/* Check marks in calendar cells */}
          <polyline points="18,34 22,38 28,30" />
          <polyline points="34,34 38,38 44,30" />
        </svg>
      );

    case 'earn':
      return (
        <svg {...props}>
          {/* Wallet */}
          <rect x="8" y="20" width="48" height="34" />
          <path d="M16 20 L16 12 Q16 8 20 8 L48 8 Q52 8 52 12 L52 20" />
          {/* Coin slot */}
          <rect x="38" y="32" width="14" height="10" />
          <circle cx="45" cy="37" r="3" />
        </svg>
      );

    default:
      return null;
  }
}
