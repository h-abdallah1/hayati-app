"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { setVolume } from "../helpers";
import { Stat, Empty } from "./shared";

export function ExerciseChart({ title, workouts, C, onBack }: {
  title: string; workouts: HevyWorkoutFull[];
  C: ReturnType<typeof useTheme>; onBack: () => void;
}) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  const points = useMemo(() => {
    return workouts
      .filter(w => w.exercises.some(ex => ex.title === title))
      .map(w => {
        const ex        = w.exercises.find(e => e.title === title)!;
        const maxWeight = Math.max(0, ...ex.sets.map(s => s.weight_kg ?? 0));
        const maxReps   = Math.max(0, ...ex.sets.map(s => s.reps ?? 0));
        const vol       = ex.sets.reduce((s, set) => s + setVolume(set), 0);
        return { date: w.date, maxWeight, maxReps, vol };
      })
      .reverse(); // chronological
  }, [workouts, title]);

  if (!points.length) return <Empty C={C} />;

  const hasWeight = points.some(p => p.maxWeight > 0);
  const W = 500, H = 120, PAD = { t: 12, r: 8, b: 24, l: 36 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const yVals    = hasWeight ? points.map(p => p.maxWeight) : points.map(p => p.maxReps);
  const yMin     = Math.max(0, Math.min(...yVals) * 0.9);
  const yMax     = Math.max(...yVals) * 1.05;
  const yRange   = yMax - yMin || 1;

  const xMin  = new Date(points[0].date).getTime();
  const xMax  = new Date(points[points.length - 1].date).getTime();
  const xRange = xMax - xMin || 1;

  const px = (i: number) => points.length === 1 ? PAD.l + iW / 2
    : PAD.l + ((new Date(points[i].date).getTime() - xMin) / xRange) * iW;
  const py = (i: number) => PAD.t + iH - ((yVals[i] - yMin) / yRange) * iH;

  const polyline = points.map((_, i) => `${px(i)},${py(i)}`).join(" ");

  const pr        = Math.max(...yVals);
  const prDate    = points[yVals.indexOf(pr)]?.date;
  const first     = points[0].date;
  const last      = points[points.length - 1].date;
  const hovP      = hovIdx !== null ? points[hovIdx] : null;

  const ticks = [yMin, yMin + yRange * 0.5, yMax].map(v => Math.round(v));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, padding: 0 }}>← back</button>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
        <Stat label="sessions"  value={String(points.length)} C={C} hi />
        {hasWeight && <Stat label="pr" value={`${pr}kg`} C={C} hi />}
        {prDate && <Stat label="pr date" value={new Date(prDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} C={C} />}
        <Stat label="first" value={new Date(first + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })} C={C} />
        <Stat label="last"  value={new Date(last  + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} C={C} />
      </div>

      {/* SVG chart */}
      <div style={{ position: "relative" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}
          onMouseLeave={() => setHovIdx(null)}>
          {/* Y-axis ticks */}
          {ticks.map((v, i) => {
            const y = PAD.t + iH - ((v - yMin) / yRange) * iH;
            return (
              <g key={i}>
                <line x1={PAD.l - 4} y1={y} x2={W - PAD.r} y2={y} stroke={C.border} strokeWidth={0.5} />
                <text x={PAD.l - 6} y={y + 3} textAnchor="end" fill={C.textFaint}
                  fontFamily="'JetBrains Mono',monospace" fontSize={8}>{v}{hasWeight ? "kg" : ""}</text>
              </g>
            );
          })}
          {/* Area fill */}
          <defs>
            <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity={0.2} />
              <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`${PAD.l},${PAD.t + iH} ${polyline} ${W - PAD.r},${PAD.t + iH}`}
            fill="url(#exGrad)"
          />
          {/* Line */}
          <polyline points={polyline} fill="none" stroke={C.accent} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          {/* Data points + hover zones */}
          {points.map((p, i) => (
            <g key={i}>
              <rect
                x={px(i) - (i === 0 ? 0 : (px(i) - px(i - 1)) / 2)}
                y={PAD.t}
                width={i === 0
                  ? (points.length > 1 ? (px(1) - px(0)) / 2 : iW)
                  : i === points.length - 1
                    ? (px(i) - px(i - 1)) / 2
                    : (px(i + 1) - px(i - 1)) / 2}
                height={iH}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => setHovIdx(i)}
              />
              <circle
                cx={px(i)} cy={py(i)} r={hovIdx === i ? 4 : 2.5}
                fill={hovIdx === i ? C.accent : C.surface}
                stroke={C.accent} strokeWidth={1.5}
                style={{ transition: "r 0.1s" }}
                pointerEvents="none"
              />
            </g>
          ))}
          {/* X axis dates (first / last) */}
          <text x={PAD.l} y={H - 4} fill={C.textFaint} fontFamily="'JetBrains Mono',monospace" fontSize={8}>
            {new Date(first + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
          {points.length > 1 && (
            <text x={W - PAD.r} y={H - 4} textAnchor="end" fill={C.textFaint} fontFamily="'JetBrains Mono',monospace" fontSize={8}>
              {new Date(last + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          )}
        </svg>

        {/* Hover tooltip */}
        {hovP && hovIdx !== null && (
          <div style={{
            position: "absolute",
            left: Math.min(px(hovIdx) * (400 / W), 340),
            top: -8,
            background: C.surface,
            border: `1px solid ${C.borderHi}`,
            borderRadius: 6,
            padding: "7px 10px",
            pointerEvents: "none",
            transform: "translateX(-50%)",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginBottom: 4 }}>
              {new Date(hovP.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            {hasWeight && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.accent }}>{hovP.maxWeight}kg</div>}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted }}>{hovP.maxReps} reps</div>
          </div>
        )}
      </div>
    </div>
  );
}
