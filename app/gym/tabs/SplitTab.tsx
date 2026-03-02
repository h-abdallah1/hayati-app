"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { SPLIT_CAT } from "../helpers";
import { Empty } from "../components/shared";

export function SplitTab({ workouts, C }: { workouts: HevyWorkoutFull[]; C: ReturnType<typeof useTheme> }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const split = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) {
      const cat = SPLIT_CAT(w.title);
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return [...map.entries()].map(([cat, count]) => ({ cat, count })).sort((a, b) => b.count - a.count);
  }, [workouts]);

  if (!split.length) return <Empty C={C} />;

  const total = split.reduce((s, e) => s + e.count, 0);
  const CAT_COLORS: Record<string, string> = {
    Push: C.accent, Pull: C.teal, Legs: C.amber,
    Upper: C.blue, Lower: C.red, "Full Body": C.textMuted, Cardio: C.teal, Other: C.textFaint,
  };

  const R = 74, SW = 26, SIZE = 220, GAP = 2, POP = 8;
  const cx = SIZE / 2, cy = SIZE / 2;
  const circ = 2 * Math.PI * R;

  let cumArc = 0;
  const segments = split.map(s => {
    const fullArc  = (s.count / total) * circ;
    const drawArc  = Math.max(0, fullArc - GAP);
    const startArc = cumArc;
    cumArc += fullArc;
    const midAngle = ((startArc + fullArc / 2) / circ) * 2 * Math.PI - Math.PI / 2;
    return { ...s, drawArc, offset: -startArc, midAngle, color: CAT_COLORS[s.cat] ?? C.textMuted };
  });

  const hovSeg = hovered ? segments.find(s => s.cat === hovered) ?? null : null;

  return (
    <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
      {/* Donut */}
      <svg width={SIZE} height={SIZE} style={{ flexShrink: 0, overflow: "visible" }}
        onMouseLeave={() => setHovered(null)}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.border} strokeWidth={SW} />
        {segments.map(s => {
          const isHov  = hovered === s.cat;
          const dimmed = hovered !== null && !isHov;
          const tx = isHov ? Math.cos(s.midAngle) * POP : 0;
          const ty = isHov ? Math.sin(s.midAngle) * POP : 0;
          return (
            <circle
              key={s.cat} cx={cx} cy={cy} r={R} fill="none"
              stroke={s.color}
              strokeWidth={isHov ? SW + 5 : SW}
              strokeDasharray={`${s.drawArc} ${circ - s.drawArc}`}
              strokeDashoffset={s.offset}
              transform={`translate(${tx} ${ty}) rotate(-90 ${cx - tx} ${cy - ty})`}
              style={{
                cursor: "pointer",
                opacity: dimmed ? 0.25 : 1,
                filter: isHov ? `drop-shadow(0 0 8px ${s.color}99)` : "none",
                transition: "opacity 0.2s, stroke-width 0.2s, filter 0.2s",
              }}
              onMouseEnter={() => setHovered(s.cat)}
            />
          );
        })}
        {/* Center label */}
        {hovSeg ? (
          <>
            <text x={cx} y={cy - 14} textAnchor="middle" fill={hovSeg.color}
              fontFamily="'JetBrains Mono',monospace" fontSize={10} fontWeight={700}>{hovSeg.cat}</text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill={C.text}
              fontFamily="'Syne',sans-serif" fontSize={26} fontWeight={800}>{hovSeg.count}</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fill={C.textFaint}
              fontFamily="'JetBrains Mono',monospace" fontSize={9}>
              {Math.round((hovSeg.count / total) * 100)}%
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text}
              fontFamily="'Syne',sans-serif" fontSize={28} fontWeight={800}>{total}</text>
            <text x={cx} y={cy + 13} textAnchor="middle" fill={C.textFaint}
              fontFamily="'JetBrains Mono',monospace" fontSize={9}>sessions</text>
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {segments.map(s => {
          const isHov  = hovered === s.cat;
          const dimmed = hovered !== null && !isHov;
          return (
            <div key={s.cat}
              onMouseEnter={() => setHovered(s.cat)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", opacity: dimmed ? 0.3 : 1, transition: "opacity 0.2s" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0, boxShadow: isHov ? `0 0 8px ${s.color}99` : "none", transition: "box-shadow 0.2s" }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: isHov ? C.text : C.textMuted, flex: 1, transition: "color 0.2s" }}>{s.cat}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: isHov ? C.textMuted : C.textFaint, transition: "color 0.2s" }}>
                {s.count} · {Math.round((s.count / total) * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
