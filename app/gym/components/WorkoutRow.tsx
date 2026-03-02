"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";

export function WorkoutRow({ w, C }: { w: HevyWorkoutFull; C: ReturnType<typeof useTheme> }) {
  const [open, setOpen] = useState(false);
  const dateLabel = new Date(w.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, width: 96, flexShrink: 0 }}>{dateLabel}</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>{w.title}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>{w.duration} min</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0, width: 20, textAlign: "right" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 12, paddingLeft: 108, display: "flex", flexDirection: "column", gap: 6 }}>
          {w.exercises.map((ex, i) => {
            const setsStr = ex.sets.map(s => {
              if (s.weight_kg && s.reps) return `${s.weight_kg}kg × ${s.reps}`;
              if (s.reps)               return `${s.reps} reps`;
              if (s.duration_seconds)   return `${Math.round(s.duration_seconds / 60)}min`;
              return "—";
            }).join("  ·  ");
            return (
              <div key={i}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{ex.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{setsStr}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
