/**
 * components/RiskGauge.jsx
 * SVG semicircular gauge displaying a [0,1] risk score.
 *
 * Colour zones:
 *   Low      0.00 – 0.39   green  (#22c55e)
 *   Moderate 0.40 – 0.69   amber  (#f59e0b)
 *   High     0.70 – 1.00   red    (#ef4444)
 */

import React, { useEffect, useRef, useState } from 'react';

const RADIUS = 80;
const CX = 110;
const CY = 110;
const STROKE = 14;
const GAP_DEG = 30; // degrees clipped at each end of the arc

function degToRad(d) { return (d * Math.PI) / 180; }

function polarToXY(cx, cy, r, angleDeg) {
  const rad = degToRad(angleDeg - 90);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polarToXY(cx, cy, r, startDeg);
  const [x2, y2] = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// Arc spans from (180 + GAP) to (360 - GAP) degrees
const ARC_START = 180 + GAP_DEG;
const ARC_END   = 360 - GAP_DEG;
const ARC_RANGE = ARC_END - ARC_START; // 300 - 2*GAP degrees = 240°

function scoreToAngle(score) {
  return ARC_START + Math.max(0, Math.min(1, score)) * ARC_RANGE;
}

function riskColor(score) {
  if (score >= 0.70) return '#ef4444';
  if (score >= 0.40) return '#f59e0b';
  return '#22c55e';
}

function riskLabel(score) {
  if (score >= 0.70) return 'HIGH RISK';
  if (score >= 0.40) return 'MODERATE';
  return 'LOW RISK';
}

export default function RiskGauge({ riskScore, confidence }) {
  const [animScore, setAnimScore] = useState(0);
  const animRef = useRef(null);

  // Animate needle on mount / value change
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = 0;
    const to = riskScore;

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimScore(from + (to - from) * eased);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [riskScore]);

  const needleAngle = scoreToAngle(animScore);
  const color = riskColor(riskScore);
  const [nx, ny] = polarToXY(CX, CY, RADIUS - STROKE / 2 - 4, needleAngle);

  return (
    <div style={styles.wrapper}>
      <svg viewBox="0 0 220 140" width="100%" style={styles.svg}>
        {/* Track (background arc) */}
        <path
          d={arcPath(CX, CY, RADIUS, ARC_START, ARC_END)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Low zone */}
        <path
          d={arcPath(CX, CY, RADIUS, ARC_START, ARC_START + ARC_RANGE * 0.40)}
          fill="none"
          stroke="rgba(34,197,94,0.25)"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />
        {/* Moderate zone */}
        <path
          d={arcPath(CX, CY, RADIUS, ARC_START + ARC_RANGE * 0.40, ARC_START + ARC_RANGE * 0.70)}
          fill="none"
          stroke="rgba(245,158,11,0.25)"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />
        {/* High zone */}
        <path
          d={arcPath(CX, CY, RADIUS, ARC_START + ARC_RANGE * 0.70, ARC_END)}
          fill="none"
          stroke="rgba(239,68,68,0.25)"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />

        {/* Active value arc */}
        <path
          d={arcPath(CX, CY, RADIUS, ARC_START, scoreToAngle(animScore))}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />

        {/* Needle dot */}
        <circle cx={nx} cy={ny} r="6" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />

        {/* Centre: score value */}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="26" fontWeight="700"
          fontFamily="Inter, sans-serif" fill={color}>
          {(animScore * 100).toFixed(0)}
        </text>
        <text x={CX} y={CY + 13} textAnchor="middle" fontSize="9" fill="#94a3b8"
          fontFamily="Inter, sans-serif" letterSpacing="0.06em">
          RISK SCORE / 100
        </text>

        {/* Zone labels */}
        <text x="30" y="125" textAnchor="middle" fontSize="7.5" fill="#22c55e" fontFamily="Inter, sans-serif" fontWeight="600">LOW</text>
        <text x="110" y="30"  textAnchor="middle" fontSize="7.5" fill="#f59e0b" fontFamily="Inter, sans-serif" fontWeight="600">MOD</text>
        <text x="190" y="125" textAnchor="middle" fontSize="7.5" fill="#ef4444" fontFamily="Inter, sans-serif" fontWeight="600">HIGH</text>
      </svg>

      {/* Risk level badge */}
      <div style={{ ...styles.levelBadge, background: `${color}22`, border: `1px solid ${color}55`, color }}>
        {riskLabel(riskScore)}
      </div>

      {/* Confidence */}
      {confidence != null && (
        <div style={styles.confidence}>
          Model confidence: <strong style={{ color: '#e2e8f0' }}>{(confidence * 100).toFixed(1)}%</strong>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  svg: { maxWidth: '240px', overflow: 'visible' },
  levelBadge: {
    padding: '0.35rem 1.2rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  confidence: {
    fontSize: '0.82rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
};
