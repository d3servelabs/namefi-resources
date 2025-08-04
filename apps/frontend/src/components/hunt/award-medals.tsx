type MedalType = 'gold' | 'silver' | 'bronze' | 'participation';

interface MedalConfig {
  gradients: {
    main: { stops: Array<{ offset: string; color: string }> };
    inner: { stops: Array<{ offset: string; color: string }> };
    star: { stops: Array<{ offset: string; color: string }> };
    stroke: { stops: Array<{ offset: string; color: string }> };
  };
}

const medalConfigs: Record<MedalType, MedalConfig> = {
  gold: {
    gradients: {
      main: {
        stops: [
          { offset: '0%', color: '#FFD700' },
          { offset: '50%', color: '#FFA500' },
          { offset: '100%', color: '#FF8C00' },
        ],
      },
      inner: {
        stops: [
          { offset: '0%', color: '#FFF8DC' },
          { offset: '100%', color: '#FFE4B5' },
        ],
      },
      star: {
        stops: [
          { offset: '0%', color: '#FFD700' },
          { offset: '100%', color: '#FFA500' },
        ],
      },
      stroke: {
        stops: [
          { offset: '0%', color: '#DAA520' },
          { offset: '100%', color: '#B8860B' },
        ],
      },
    },
  },
  silver: {
    gradients: {
      main: {
        stops: [
          { offset: '0%', color: '#C0C0C0' },
          { offset: '50%', color: '#A9A9A9' },
          { offset: '100%', color: '#808080' },
        ],
      },
      inner: {
        stops: [
          { offset: '0%', color: '#F5F5F5' },
          { offset: '100%', color: '#E0E0E0' },
        ],
      },
      star: {
        stops: [
          { offset: '0%', color: '#C0C0C0' },
          { offset: '100%', color: '#A9A9A9' },
        ],
      },
      stroke: {
        stops: [
          { offset: '0%', color: '#696969' },
          { offset: '100%', color: '#2F4F4F' },
        ],
      },
    },
  },
  bronze: {
    gradients: {
      main: {
        stops: [
          { offset: '0%', color: '#CD7F32' },
          { offset: '50%', color: '#B8860B' },
          { offset: '100%', color: '#8B4513' },
        ],
      },
      inner: {
        stops: [
          { offset: '0%', color: '#F4E4BC' },
          { offset: '100%', color: '#E6D3A3' },
        ],
      },
      star: {
        stops: [
          { offset: '0%', color: '#CD7F32' },
          { offset: '100%', color: '#B8860B' },
        ],
      },
      stroke: {
        stops: [
          { offset: '0%', color: '#8B4513' },
          { offset: '100%', color: '#654321' },
        ],
      },
    },
  },
  participation: {
    gradients: {
      main: {
        stops: [
          { offset: '0%', color: '#4A90E2' },
          { offset: '50%', color: '#357ABD' },
          { offset: '100%', color: '#2E5A8A' },
        ],
      },
      inner: {
        stops: [
          { offset: '0%', color: '#E3F2FD' },
          { offset: '100%', color: '#BBDEFB' },
        ],
      },
      star: {
        stops: [
          { offset: '0%', color: '#4A90E2' },
          { offset: '100%', color: '#357ABD' },
        ],
      },
      stroke: {
        stops: [
          { offset: '0%', color: '#2E5A8A' },
          { offset: '100%', color: '#1A365D' },
        ],
      },
    },
  },
};

export interface MedalProps {
  type: MedalType;
  className?: string;
}

export const Medal = ({ type, className }: MedalProps) => {
  const config = medalConfigs[type];
  const gradientId = `${type}Gradient`;
  const innerId = `${type}Inner`;
  const starId = `${type}Star`;
  const strokeId = `${type}Stroke`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby={`${type}-medal-title`}
    >
      <title id={`${type}-medal-title`}>Medal</title>
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={`url(#${gradientId})`}
        stroke={`url(#${strokeId})`}
        strokeWidth="2"
      />
      <circle cx="32" cy="32" r="24" fill={`url(#${innerId})`} opacity="0.3" />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {config.gradients.main.stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={innerId} x1="0%" y1="0%" x2="100%" y2="100%">
          {config.gradients.inner.stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={starId} x1="0%" y1="0%" x2="100%" y2="100%">
          {config.gradients.star.stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
        <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="100%">
          {config.gradients.stroke.stops.map((stop, index) => (
            <stop key={index} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
    </svg>
  );
};
