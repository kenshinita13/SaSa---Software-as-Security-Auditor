import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function ScoreRing({ score, size = 160, strokeWidth = 10, showLabel = true }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  let color: string;
  let glow: string;
  let label: string;

  if (score >= 80) {
    color = '#34d399';
    glow = 'rgba(52,211,153,0.4)';
    label = 'Secure';
  } else if (score >= 50) {
    color = '#fbbf24';
    glow = 'rgba(251,191,36,0.4)';
    label = 'At Risk';
  } else {
    color = '#f87171';
    glow = 'rgba(248,113,113,0.4)';
    label = 'Critical';
  }

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${score}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={`url(#glow-${score})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {showLabel && (
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: size * 0.25, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
            {score}
          </div>
          <div style={{ fontSize: size * 0.1, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
