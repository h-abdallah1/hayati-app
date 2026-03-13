"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Empty } from "../components/shared";

type WeekVol = { label: string; vol: number };

export function VolumeTab({ selectedYear, C }: { selectedYear: number; C: ReturnType<typeof useTheme> }) {
  const [weeks, setWeeks] = useState<WeekVol[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setWeeks([]);
    setTotal(0);
    fetch(`/api/hevy/analytics/volume?year=${selectedYear}`)
      .then(r => r.json())
      .then(d => { setWeeks(d.byWeek ?? []); setTotal(d.total ?? 0); })
      .catch(() => {});
  }, [selectedYear]);

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
        total volume · {Math.round(total / 1000)}t
      </div>
    </div>
  );
}
