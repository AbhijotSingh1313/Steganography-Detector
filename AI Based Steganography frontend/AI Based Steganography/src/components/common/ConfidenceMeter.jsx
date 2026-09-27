import React from 'react';

export default function ConfidenceMeter({ percentage = 94, size = 180, strokeWidth = 12, label = 'AI Detection Confidence' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Choose gauge color based on confidence & typical threshold
  let strokeColor = '#00f0ff';
  if (percentage >= 90) strokeColor = '#00f0ff';
  else if (percentage >= 70) strokeColor = '#ffb800';
  else strokeColor = '#00ff9d';

  return (
    <div className="confidence-gauge-container">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(45, 66, 107, 0.4)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
              filter: `drop-shadow(0 0 8px ${strokeColor})`
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {percentage}%
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '-2px' }}>
            Confidence
          </span>
        </div>
      </div>

      {label && (
        <p style={{ marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
          {label}
        </p>
      )}
    </div>
  );
}
