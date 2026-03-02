"use client";

import { useMemo } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import { weekStart, workoutVolume } from "../helpers";
import { Empty } from "../components/shared";

export function VolumeTab({ workouts, C }: { workouts: HevyWorkoutFull[]; C: ReturnType<typeof useTheme> }) {
  const weeks = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) {
      const wk = weekStart(w.date);
      map.set(wk, (map.get(wk) ?? 0) + workoutVolume(w));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, vol]) => ({
        label: new Date(wk + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        vol: Math.round(vol),
      }));
  }, [workouts]);

  if (!weeks.length) return <Empty C={C} />;

  const maxVol = Math.max(...weeks.map(w => w.vol), 1);
  const BAR_H  = 100;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, overflowX: "auto", paddingBottom: 8, minHeight: BAR_H + 32 }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, writingMode: "vertical-rl", transform: "rotate(180deg)", marginBottom: 2 }}>
              {Math.round(w.vol / 1000)}t
            </span>
            <div
              title={`${w.label}: ${w.vol.toLocaleString()}kg`}
              style={{
                width: 22,
                height: Math.max(3, Math.round((w.vol / maxVol) * BAR_H)),
                background: `${C.accent}90`,
                borderRadius: "3px 3px 0 0",
                transition: "height .3s",
              }}
            />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, textAlign: "center", whiteSpace: "nowrap" }}>{w.label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 12 }}>
        total volume · {Math.round(weeks.reduce((s, w) => s + w.vol, 0) / 1000)}t
      </div>
    </div>
  );
}
