"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";

// ── helpers ────────────────────────────────────────────────────────────────

function isLeapYear(y: number) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function dayOfYear(d: Date)    { return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1; }

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_INITIALS = ["S","M","T","W","T","F","S"];
const SHOW_DAY = new Set([1, 3, 5]);

function monthStartCols(jan1DOW: number, leap: boolean): number[] {
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const cols: number[] = [];
  let idx = jan1DOW;
  for (const d of days) { cols.push(Math.floor(idx / 7)); idx += d; }
  return cols;
}

// ── Heatmap ────────────────────────────────────────────────────────────────

function GymHeatmap({ workoutDates }: { workoutDates: Set<string> }) {
  const C       = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sq, setSq] = useState(10);

  const GAP  = 3;
  const DL_W = 10;
  const DL_G = 6;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () =>
      setSq(Math.min(11, Math.max(6, Math.floor((el.offsetWidth - DL_W - DL_G - 52 * GAP) / 53))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const now   = new Date();
  const year  = now.getFullYear();
  const leap  = isLeapYear(year);
  const total = leap ? 366 : 365;
  const today = dayOfYear(now);

  const jan1DOW = new Date(year, 0, 1).getDay();
  const mCols   = monthStartCols(jan1DOW, leap);
  const step    = sq + GAP;
  const BR      = Math.max(1, Math.round(sq * 0.2));
  const pulse   = Math.max(2, Math.round(sq * 0.35));

  const toDateStr = (d: number) => {
    const date = new Date(year, 0, d);
    return date.toISOString().split("T")[0];
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <style>{`
        @keyframes gymPulse {
          0%, 100% { box-shadow: 0 0 0 0px ${C.accent}60; }
          55%       { box-shadow: 0 0 0 ${pulse}px ${C.accent}1e; }
        }
        .gym-today { animation: gymPulse 2.6s ease-in-out infinite; }
      `}</style>

      <div ref={wrapRef} style={{ width: "100%" }}>
        <div style={{ paddingLeft: DL_W + DL_G, position: "relative", height: 14, marginBottom: 5 }}>
          {mCols.map((col, m) => (
            <span key={m} style={{ position: "absolute", left: col * step, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, userSelect: "none" }}>
              {MONTH_NAMES[m].slice(0, 3).toLowerCase()}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: DL_G, alignItems: "flex-start" }}>
          <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${sq}px)`, gap: GAP, width: DL_W, flexShrink: 0 }}>
            {DAY_INITIALS.map((l, i) => (
              <div key={i} style={{ height: sq, display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: Math.min(9, Math.max(7, Math.round(sq * 0.65))), color: SHOW_DAY.has(i) ? C.textFaint : "transparent", userSelect: "none" }}>
                {l}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${sq}px)`, gridAutoColumns: `${sq}px`, gridAutoFlow: "column", gap: GAP }}>
            {Array.from({ length: jan1DOW }).map((_, i) => <div key={`o${i}`} style={{ width: sq, height: sq }} />)}
            {Array.from({ length: total }).map((_, i) => {
              const d       = i + 1;
              const isToday = d === today;
              const past    = d < today;
              const dateStr = toDateStr(d);
              const trained = workoutDates.has(dateStr);
              return (
                <div
                  key={d}
                  title={dateStr}
                  className={isToday ? "gym-today" : undefined}
                  style={{
                    width: sq, height: sq, borderRadius: BR,
                    background: isToday
                      ? (trained ? C.accent : C.borderHi)
                      : trained
                      ? `${C.accent}80`
                      : past ? C.border : `${C.border}55`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Workout row ────────────────────────────────────────────────────────────

function WorkoutRow({ w, C }: { w: HevyWorkoutFull; C: ReturnType<typeof useTheme> }) {
  const [open, setOpen] = useState(false);
  const dateLabel = new Date(w.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, width: 96, flexShrink: 0 }}>{dateLabel}</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, flex: 1 }}>{w.title}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>{w.duration} min</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0, width: 20, textAlign: "right" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ paddingBottom: 12, paddingLeft: 108, display: "flex", flexDirection: "column", gap: 6 }}>
          {w.exercises.map((ex, i) => {
            const setsStr = ex.sets.map(s => {
              if (s.weight_kg && s.reps)    return `${s.weight_kg}kg × ${s.reps}`;
              if (s.reps)                   return `${s.reps} reps`;
              if (s.duration_seconds)       return `${Math.round(s.duration_seconds / 60)}min`;
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

// ── Page ───────────────────────────────────────────────────────────────────

type Stats    = { count: number; streak: number; loggedToday: boolean; workoutDates: string[] };
type Lifetime = { totalSessions: number; totalHrs: number; longestStreak: number; firstDate: string | null };

export default function GymPage() {
  const C = useTheme();
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [lifetime, setLifetime] = useState<Lifetime | null>(null);
  const [workouts, setWorkouts] = useState<HevyWorkoutFull[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/hevy").then(r => r.json()),
      fetch("/api/hevy/workouts").then(r => r.json()),
      fetch("/api/hevy/lifetime").then(r => r.json()),
    ]).then(([s, w, l]) => {
      setStats(s);
      setWorkouts(w.workouts ?? []);
      setLifetime(l.error ? null : l);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const workoutDates = new Set(stats?.workoutDates ?? []);
  const count        = stats?.count    ?? 0;
  const streak       = stats?.streak   ?? 0;
  const GOAL         = 200;

  const now          = new Date();
  const weekNum      = Math.ceil((dayOfYear(now) + new Date(now.getFullYear(), 0, 1).getDay()) / 7);
  const avgPerWeek   = weekNum > 0 ? (count / weekNum).toFixed(1) : "—";
  const progress     = Math.min(100, (count / GOAL) * 100);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>Gym</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 18, color: C.textFaint, marginLeft: 10 }}>رياضة</span>
            {stats?.loggedToday && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, marginLeft: 14 }}>✓ trained today</span>
            )}
          </div>

          {/* Lifetime stats */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {[
              { label: "all-time",       value: lifetime ? String(lifetime.totalSessions) : "—", unit: "sessions" },
              { label: "total time",     value: lifetime ? String(lifetime.totalHrs)      : "—", unit: "hrs"      },
              { label: "longest streak", value: lifetime ? String(lifetime.longestStreak) : "—", unit: "days"     },
              { label: "since",          value: lifetime?.firstDate
                  ? new Date(lifetime.firstDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : "—",
                unit: "" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: C.text, lineHeight: 1 }}>
                  {s.value}
                  {s.unit && <span style={{ fontSize: 9, color: C.textFaint, marginLeft: 3 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 28, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { label: "sessions",  value: String(count),      sub: `/ ${GOAL}`, hi: true  },
            { label: "streak",    value: String(streak),     sub: "days"                 },
            { label: "avg / week",value: String(avgPerWeek), sub: "sessions"             },
            { label: "remaining", value: String(Math.max(0, GOAL - count)), sub: "left"  },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: s.hi ? C.accent : C.text, lineHeight: 1 }}>
                {loading ? "—" : s.value}
                {s.sub && <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 4 }}>{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 28 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: C.accent, borderRadius: 2, boxShadow: `0 0 10px ${C.accent}55`, transition: "width .4s" }} />
        </div>

        {/* Heatmap */}
        <GymHeatmap workoutDates={workoutDates} />

        {/* Workout history */}
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 12 }}>
          {loading ? "loading…" : `${workouts.length} sessions in ${now.getFullYear()}`}
        </div>

        <div>
          {workouts.map(w => <WorkoutRow key={w.id} w={w} C={C} />)}
          {!loading && workouts.length === 0 && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>no sessions yet</div>
          )}
        </div>

      </div>
    </div>
  );
}
