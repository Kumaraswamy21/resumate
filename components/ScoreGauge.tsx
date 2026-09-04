type ScoreGaugeProps = {
  score: number;
};

function scoreColor(score: number): string {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#F59E0B";
  return "#DC2626";
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped);

  // Arc from 135° to 405° (270° sweep) in a 200×120 viewBox.
  const cx = 100;
  const cy = 100;
  const r = 72;
  const startAngle = 135;
  const sweep = 270;
  const progress = (clamped / 100) * sweep;

  function polar(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(fromDeg: number, lengthDeg: number): string {
    if (lengthDeg <= 0) return "";
    const start = polar(fromDeg);
    const end = polar(fromDeg + lengthDeg);
    const largeArc = lengthDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const track = arcPath(startAngle, sweep);
  const value = arcPath(startAngle, progress);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 140"
        className="h-40 w-56 sm:h-48 sm:w-64"
        role="img"
        aria-label={`ATS Score: ${clamped} out of 100`}
      >
        <path
          d={track}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {value ? (
          <path
            d={value}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
          />
        ) : null}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900 text-4xl font-bold"
          style={{ fontSize: "42px", fontWeight: 700 }}
        >
          {clamped}
        </text>
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          ATS Score
        </text>
      </svg>
    </div>
  );
}
