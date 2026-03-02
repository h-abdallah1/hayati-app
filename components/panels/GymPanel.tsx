"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Panel, Tag } from "@/components/ui";

const STORAGE_KEY = "hayati-gym";
const YEAR_GOAL = 200;

function loadDates(): string[] {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
function saveDates(dates: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dates)); } catch {}
}
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}
function calcStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  if (!set.has(toDateStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(toDateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

export function GymPanel() {
  const C = useTheme();
  const [dates, setDates] = useState<string[]>([]);
  const today = toDateStr(new Date());
  const year = new Date().getFullYear();

  useEffect(() => { setDates(loadDates()); }, []);

  const yearDates = dates.filter(d => d.startsWith(String(year)));
  const count = yearDates.length;
  const progress = Math.min(100, (count / YEAR_GOAL) * 100);
  const loggedToday = dates.includes(today);
  const streak = calcStreak(dates);

  const logToday = () => {
    if (loggedToday) return;
    const next = [...dates, today];
    setDates(next); saveDates(next);
  };
  const undo = () => {
    const next = dates.filter(d => d !== today);
    setDates(next); saveDates(next);
  };

  return (
    <Panel style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tag color={loggedToday ? C.accent : C.textFaint}>Gym</Tag>
        {loggedToday
          ? <button onClick={undo} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>undo</button>
          : <button onClick={logToday} style={{ background: C.accentDim, border: `1px solid ${C.accent}`, borderRadius: 5, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, padding: "3px 10px" }}>+ log today</button>
        }
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 42, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{count}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>/ {YEAR_GOAL}</span>
      </div>

      <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: C.accent, borderRadius: 2, boxShadow: `0 0 8px ${C.accent}55`, transition: "width .3s" }} />
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: "auto" }}>
        {[
          { label: "streak", val: String(streak), unit: "days", color: streak > 0 ? C.amber : C.textFaint },
          { label: "remaining", val: String(Math.max(0, YEAR_GOAL - count)), unit: "left", color: C.textMuted },
          { label: "today", val: loggedToday ? "✓" : "—", unit: "", color: loggedToday ? C.accent : C.textFaint },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: s.color, lineHeight: 1 }}>
              {s.val}
              {s.unit && <span style={{ fontSize: 9, marginLeft: 3, color: C.textFaint }}>{s.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
