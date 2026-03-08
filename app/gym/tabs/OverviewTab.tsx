"use client";

import { useMemo } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { SPLIT_CAT } from "../helpers";
import { Sparkline, Empty } from "../components/shared";

function SectionLabel({ label, C }: { label: string; C: ReturnType<typeof useTheme> }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 12 }}>
      {label}
    </div>
  );
}

export function OverviewTab({ workouts, count, streak, avgPerWeek, selectedYear, C }: {
  workouts: HevyWorkoutFull[];
  count: number; streak: number; avgPerWeek: string; selectedYear: number;
  C: ReturnType<typeof useTheme>;
}) {
  const curYear   = new Date().getFullYear();
  const isCurYear = selectedYear === curYear;
  const today     = new Date().toISOString().split("T")[0];
  const workoutSet = useMemo(() => new Set(workouts.map(w => w.date)), [workouts]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    return d.toISOString().split("T")[0];
  }), []);

  const topExercises = useMemo(() => {
    const map = new Map<string, { count: number; history: { weight: number }[] }>();
    for (const w of [...workouts].reverse()) {
      for (const ex of w.exercises) {
        const p = map.get(ex.title) ?? { count: 0, history: [] };
        const max = Math.max(0, ...ex.sets.map(s => s.weight_kg ?? 0));
        map.set(ex.title, { count: p.count + 1, history: max > 0 ? [...p.history, { weight: max }] : p.history });
      }
    }
    return [...map.entries()].map(([title, s]) => ({ title, ...s })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [workouts]);

  const splitRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) { const cat = SPLIT_CAT(w.title); map.set(cat, (map.get(cat) ?? 0) + 1); }
    return [...map.entries()].map(([cat, n]) => ({ cat, n })).sort((a, b) => b.n - a.n).slice(0, 5);
  }, [workouts]);

  const CAT_COLORS: Record<string, string> = {
    Push: C.accent, Pull: C.teal, Legs: C.amber,
    Upper: C.blue, Lower: C.red, "Full Body": C.textMuted, Cardio: C.teal, Other: C.textFaint,
  };
  const splitMax = splitRows[0]?.n ?? 1;
  const recent   = workouts.slice(0, 4);

  if (!workouts.length) return <Empty C={C} />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", alignItems: "start" }}>

      {/* ── Left ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Progress */}
        <div>
          <SectionLabel label="progress" C={C} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 52, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{count}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.textFaint }}>sessions</span>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
            {[
              { label: "streak",   val: String(streak), unit: "wks", color: streak > 0 ? C.amber : C.textMuted },
              { label: "avg/week", val: avgPerWeek,     unit: "",    color: C.textMuted },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: s.color, lineHeight: 1 }}>
                  {s.val}{s.unit && <span style={{ fontSize: 9, color: C.textFaint, marginLeft: 3 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* This week (current year only) */}
        {isCurYear && (
          <div>
            <SectionLabel label="this week" C={C} />
            <div style={{ display: "flex", gap: 5 }}>
              {week.map(date => {
                const trained = workoutSet.has(date);
                const isToday = date === today;
                const label   = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
                return (
                  <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: "100%", aspectRatio: "1", borderRadius: 5,
                      background: trained ? (isToday ? C.accent : `${C.accent}70`) : C.border,
                      boxShadow: trained && isToday ? `0 0 8px ${C.accent}55` : undefined,
                      border: isToday && !trained ? `1px solid ${C.borderHi}` : "1px solid transparent",
                    }} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: isToday ? C.textMuted : C.textFaint }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div>
          <SectionLabel label="recent" C={C} />
          <div>
            {recent.map((w, i) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, flexShrink: 0, width: 60 }}>
                  {new Date(w.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, flexShrink: 0 }}>{w.duration}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Top exercises */}
        <div>
          <SectionLabel label="top exercises" C={C} />
          <div>
            {topExercises.map((ex, i) => (
              <div key={ex.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < topExercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, width: 14, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: ex.history.length >= 2 ? 4 : 0 }}>{ex.title}</div>
                  {ex.history.length >= 2 && <Sparkline history={ex.history} C={C} />}
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, flexShrink: 0 }}>{ex.count}×</span>
              </div>
            ))}
          </div>
        </div>

        {/* Split */}
        {splitRows.length > 0 && (
          <div>
            <SectionLabel label="split" C={C} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {splitRows.map(s => {
                const color = CAT_COLORS[s.cat] ?? C.textMuted;
                return (
                  <div key={s.cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted }}>{s.cat}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{s.n}</span>
                    </div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(s.n / splitMax) * 100}%`, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}44`, transition: "width .3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
