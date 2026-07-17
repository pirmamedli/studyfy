interface RingProps {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  centerColor?: string;
  fontSize?: number;
  children?: React.ReactNode;
}

export function Ring({
  value,
  size = 66,
  stroke = 6,
  color = "var(--accent)",
  track = "var(--surface-2)",
  centerColor = "var(--ink)",
  fontSize = 16,
  children,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c * (1 - clamped / 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          style={{ transition: "stroke-dashoffset .9s var(--ease)" }}
        />
      </svg>
      <span className="ring-center" style={{ color: centerColor, fontSize }}>
        {children ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
