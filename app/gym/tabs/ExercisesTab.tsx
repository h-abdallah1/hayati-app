"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { Sparkline, Pager, Stat, Empty } from "../components/shared";
import { ExerciseChart } from "../components/ExerciseChart";

const EX_PAGE = 10;

export function ExercisesTab({ workouts, C, selectedEx, setSelectedEx }: {
  workouts: HevyWorkoutFull[];
  C: ReturnType<typeof useTheme>;
  selectedEx: string | null;
  setSelectedEx: (v: string | null) => void;
}) {
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; sets: number; reps: number; maxWeight: number; history: { weight: number }[] }>();
    for (const w of [...workouts].reverse()) {
      for (const ex of w.exercises) {
        const p = map.get(ex.title) ?? { count: 0, sets: 0, reps: 0, maxWeight: 0, history: [] };
        const sessionMax = Math.max(0, ...ex.sets.map(s => s.weight_kg ?? 0));
        map.set(ex.title, {
          count:     p.count + 1,
          sets:      p.sets + ex.sets.length,
          reps:      p.reps + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0),
          maxWeight: Math.max(p.maxWeight, sessionMax),
          history:   sessionMax > 0 ? [...p.history, { weight: sessionMax }] : p.history,
        });
      }
    }
    return [...map.entries()].map(([title, s]) => ({ title, ...s })).sort((a, b) => b.count - a.count);
  }, [workouts]);

  useEffect(() => { setPage(1); }, [workouts]);

  if (selectedEx) return <ExerciseChart title={selectedEx} workouts={workouts} C={C} onBack={() => setSelectedEx(null)} />;

  const pageCount = Math.ceil(stats.length / EX_PAGE);
  const paged     = stats.slice((page - 1) * EX_PAGE, page * EX_PAGE);
  const offset    = (page - 1) * EX_PAGE;

  if (!stats.length) return <Empty C={C} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          {stats.length} exercises · click to see progress
        </span>
        <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {paged.map((s, i) => (
          <div key={s.title}
            onClick={() => setSelectedEx(s.title)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < paged.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, width: 20, textAlign: "right", flexShrink: 0 }}>{offset + i + 1}</span>
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{s.title}</div>
              {s.history.length >= 2
                ? <Sparkline history={s.history} C={C} />
                : <div style={{ height: 22, display: "flex", alignItems: "center" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>bodyweight</span>
                  </div>
              }
            </div>
            <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
              <Stat label="times" value={String(s.count)} C={C} />
              <Stat label="sets"  value={String(s.sets)}  C={C} />
              <Stat label="reps"  value={String(s.reps)}  C={C} />
              {s.maxWeight > 0 && <Stat label="max" value={`${s.maxWeight}kg`} C={C} />}
            </div>
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
        </div>
      )}
    </div>
  );
}
