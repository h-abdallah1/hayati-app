"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { usePanelSize } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";

type HevyData = {
  count: number;
  streak: number;
  loggedToday: boolean;
  lastWorkout: { title: string; date: string; duration: number } | null;
  week: string[];
  workoutDates: string[];
};

export function GymPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const [data, setData]       = useState<HevyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced]   = useState<Date | null>(null);

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/hevy");
      const json = await res.json();
      if (!json.error) { setData(json); setSynced(new Date()); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { sync(); }, [sync]);

  const count        = data?.count        ?? 0;
  const streak       = data?.streak       ?? 0;
  const loggedToday  = data?.loggedToday  ?? false;
  const last         = data?.lastWorkout  ?? null;
  const week         = data?.week         ?? [];
  const workoutSet   = new Set(data?.workoutDates ?? []);
  const today        = new Date().toISOString().split("T")[0];

  const sm = height > 0 && height < 175;

  return (
    <Panel ref={ref} style={{ display: "flex", flexDirection: "column", padding: 14 }}>
      <div className="hayati-drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Tag color={loggedToday ? C.accent : C.textFaint}>Gym</Tag>
        <button
          onClick={sync}
          disabled={loading}
          style={{ background: "none", border: "none", cursor: loading ? "default" : "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, opacity: loading ? 0.4 : 1 }}
        >
          {loading ? "syncing…" : "↻ sync"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: sm ? 8 : 14 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: sm ? 28 : 42, fontWeight: 800, color: loading ? C.textFaint : C.accent, lineHeight: 1 }}>
          {loading ? "—" : count}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>sessions</span>
      </div>

      {/* 7-day strip */}
      {(height === 0 || height >= 175) && week.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {week.map(date => {
            const trained  = workoutSet.has(date);
            const isToday  = date === today;
            const dayLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
            return (
              <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", aspectRatio: "1", borderRadius: 4,
                  background: trained ? (isToday ? C.accent : `${C.accent}70`) : C.border,
                  boxShadow: trained && isToday ? `0 0 8px ${C.accent}55` : undefined,
                  border: isToday && !trained ? `1px solid ${C.borderHi}` : "1px solid transparent",
                  transition: "background .2s",
                }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: isToday ? C.textMuted : C.textFaint }}>
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(height === 0 || height >= 175) && (
        <div style={{ display: "flex", gap: 20, marginBottom: last ? 14 : 0 }}>
          {[
            { label: "streak", val: String(streak),             unit: "wks", color: streak > 0 ? C.amber : C.textFaint },
            { label: "today",  val: loggedToday ? "✓" : "—", unit: "",    color: loggedToday ? C.accent : C.textFaint },
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
      )}

      {(height === 0 || height >= 230) && last && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: "auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>last session</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last.title}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 2 }}>
            {new Date(last.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {last.duration} min
          </div>
        </div>
      )}

      {(height === 0 || height >= 260) && synced && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, marginTop: 8 }}>
          synced {synced.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </Panel>
  );
}
