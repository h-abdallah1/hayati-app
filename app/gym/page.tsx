"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "@/lib/theme";
import type { HevyWorkoutFull, HevySet } from "@/app/api/hevy/workouts/route";

// ── helpers ────────────────────────────────────────────────────────────────

function isLeapYear(y: number) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function dayOfYear(d: Date)    { return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1; }

function calcStreak(dates: string[]): number {
  const set = new Set(dates);
  const d   = new Date();
  if (!set.has(d.toISOString().split("T")[0])) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function weekStart(dateStr: string): string {
  const d   = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().split("T")[0];
}

function setVolume(s: HevySet): number { return (s.weight_kg ?? 0) * (s.reps ?? 0); }
function workoutVolume(w: HevyWorkoutFull): number {
  return w.exercises.reduce((t, ex) => t + ex.sets.reduce((s, set) => s + setVolume(set), 0), 0);
}

const SPLIT_CAT = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes("push"))  return "Push";
  if (t.includes("pull"))  return "Pull";
  if (t.includes("leg"))   return "Legs";
  if (t.includes("upper")) return "Upper";
  if (t.includes("lower")) return "Lower";
  if (t.includes("full"))  return "Full Body";
  if (t.includes("cardio") || t.includes("run")) return "Cardio";
  return "Other";
};

const MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_INITIALS = ["S","M","T","W","T","F","S"];
const SHOW_DAY     = new Set([1, 3, 5]);

function monthStartCols(jan1DOW: number, leap: boolean): number[] {
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const cols: number[] = []; let idx = jan1DOW;
  for (const d of days) { cols.push(Math.floor(idx / 7)); idx += d; }
  return cols;
}

// ── Heatmap ────────────────────────────────────────────────────────────────

function GymHeatmap({ workoutDates, year }: { workoutDates: Set<string>; year: number }) {
  const C = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sq, setSq] = useState(10);
  const GAP = 3; const DL_W = 10; const DL_G = 6;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setSq(Math.min(11, Math.max(6, Math.floor((el.offsetWidth - DL_W - DL_G - 52 * GAP) / 53))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const now      = new Date();
  const curYear  = now.getFullYear();
  const leap     = isLeapYear(year);
  const total    = leap ? 366 : 365;
  const todayDOY = year === curYear ? dayOfYear(now) : year < curYear ? total + 1 : 0;
  const jan1DOW  = new Date(year, 0, 1).getDay();
  const mCols    = monthStartCols(jan1DOW, leap);
  const step     = sq + GAP;
  const BR       = Math.max(1, Math.round(sq * 0.2));
  const pulse    = Math.max(2, Math.round(sq * 0.35));
  const toStr    = (d: number) => new Date(year, 0, d).toISOString().split("T")[0];

  return (
    <div style={{ marginBottom: 28 }}>
      <style>{`
        @keyframes gymPulse{0%,100%{box-shadow:0 0 0 0px ${C.accent}60;}55%{box-shadow:0 0 0 ${pulse}px ${C.accent}1e;}}
        .gym-today{animation:gymPulse 2.6s ease-in-out infinite;}
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
          <div style={{ display: "grid", gridTemplateRows: `repeat(7,${sq}px)`, gap: GAP, width: DL_W, flexShrink: 0 }}>
            {DAY_INITIALS.map((l, i) => (
              <div key={i} style={{ height: sq, display: "flex", alignItems: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: Math.min(9, Math.max(7, Math.round(sq * 0.65))), color: SHOW_DAY.has(i) ? C.textFaint : "transparent", userSelect: "none" }}>{l}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateRows: `repeat(7,${sq}px)`, gridAutoColumns: `${sq}px`, gridAutoFlow: "column", gap: GAP }}>
            {Array.from({ length: jan1DOW }).map((_, i) => <div key={`o${i}`} style={{ width: sq, height: sq }} />)}
            {Array.from({ length: total }).map((_, i) => {
              const d = i + 1;
              const isToday = d === todayDOY;
              const trained = workoutDates.has(toStr(d));
              return (
                <div key={d} title={toStr(d)} className={isToday ? "gym-today" : undefined} style={{
                  width: sq, height: sq, borderRadius: BR,
                  background: isToday ? (trained ? C.accent : C.borderHi) : trained ? `${C.accent}80` : d < todayDOY ? C.border : `${C.border}55`,
                }} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Workout row (Sessions tab) ──────────────────────────────────────────────

function WorkoutRow({ w, C }: { w: HevyWorkoutFull; C: ReturnType<typeof useTheme> }) {
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

// ── Tab: Exercises ──────────────────────────────────────────────────────────

const EX_PAGE = 10;

function ExercisesTab({ workouts, C }: { workouts: HevyWorkoutFull[]; C: ReturnType<typeof useTheme> }) {
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; sets: number; reps: number; maxWeight: number }>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        const p = map.get(ex.title) ?? { count: 0, sets: 0, reps: 0, maxWeight: 0 };
        map.set(ex.title, {
          count:     p.count + 1,
          sets:      p.sets + ex.sets.length,
          reps:      p.reps + ex.sets.reduce((s, set) => s + (set.reps ?? 0), 0),
          maxWeight: Math.max(p.maxWeight, ...ex.sets.map(s => s.weight_kg ?? 0)),
        });
      }
    }
    return [...map.entries()].map(([title, s]) => ({ title, ...s })).sort((a, b) => b.count - a.count);
  }, [workouts]);

  useEffect(() => { setPage(1); }, [workouts]);

  const maxCount  = stats[0]?.count ?? 1;
  const pageCount = Math.ceil(stats.length / EX_PAGE);
  const paged     = stats.slice((page - 1) * EX_PAGE, page * EX_PAGE);
  const offset    = (page - 1) * EX_PAGE;

  if (!stats.length) return <Empty C={C} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          {stats.length} exercises
        </span>
        <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {paged.map((s, i) => (
          <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < paged.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, width: 20, textAlign: "right", flexShrink: 0 }}>{offset + i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{s.title}</div>
              <div style={{ height: 2, background: C.border, borderRadius: 1 }}>
                <div style={{ height: "100%", width: `${(s.count / maxCount) * 100}%`, background: C.accent, borderRadius: 1 }} />
              </div>
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

// ── Tab: Volume ─────────────────────────────────────────────────────────────

function VolumeTab({ workouts, C }: { workouts: HevyWorkoutFull[]; C: ReturnType<typeof useTheme> }) {
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

  const maxVol  = Math.max(...weeks.map(w => w.vol), 1);
  const BAR_H   = 100;

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

// ── Tab: PRs ────────────────────────────────────────────────────────────────

const PR_PAGE = 10;

function PRsTab({ workouts, C }: { workouts: HevyWorkoutFull[]; C: ReturnType<typeof useTheme> }) {
  const [page, setPage] = useState(1);

  const prs = useMemo(() => {
    const map = new Map<string, { weight: number; reps: number; date: string }>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.weight_kg || !s.reps) continue;
          const prev = map.get(ex.title);
          if (!prev || s.weight_kg > prev.weight || (s.weight_kg === prev.weight && s.reps > prev.reps)) {
            map.set(ex.title, { weight: s.weight_kg, reps: s.reps, date: w.date });
          }
        }
      }
    }
    return [...map.entries()]
      .map(([title, { weight, reps, date }]) => ({
        title, weight, reps, date,
        orm: Math.round(weight * (1 + reps / 30)),
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [workouts]);

  useEffect(() => { setPage(1); }, [workouts]);

  const pageCount = Math.ceil(prs.length / PR_PAGE);
  const paged     = prs.slice((page - 1) * PR_PAGE, page * PR_PAGE);
  const offset    = (page - 1) * PR_PAGE;

  if (!prs.length) return <Empty C={C} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          {prs.length} exercises
        </span>
        <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {paged.map((pr, i) => (
          <div key={pr.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < paged.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, width: 20, textAlign: "right", flexShrink: 0 }}>{offset + i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.title}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 2 }}>
                {new Date(pr.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
              <Stat label="weight"  value={`${pr.weight}kg`} C={C} hi />
              <Stat label="reps"    value={String(pr.reps)}   C={C} />
              <Stat label="est 1RM" value={`${pr.orm}kg`}     C={C} />
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

// ── Tab: Split ──────────────────────────────────────────────────────────────

function SplitTab({ workouts, C }: { workouts: HevyWorkoutFull[]; C: ReturnType<typeof useTheme> }) {
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

// ── Shared mini components ──────────────────────────────────────────────────

function Pager({ page, pageCount, setPage, C }: { page: number; pageCount: number; setPage: (fn: (p: number) => number) => void; C: ReturnType<typeof useTheme> }) {
  if (pageCount <= 1) return null;
  const btn = (disabled: boolean): React.CSSProperties => ({
    background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1,
    fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
    color: C.textMuted, padding: "2px 8px", lineHeight: 1.6,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={btn(page === 1)}         disabled={page === 1}         onClick={() => setPage(p => p - 1)}>‹</button>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{page} / {pageCount}</span>
      <button style={btn(page === pageCount)} disabled={page === pageCount} onClick={() => setPage(p => p + 1)}>›</button>
    </div>
  );
}

function Stat({ label, value, C, hi }: { label: string; value: string; C: ReturnType<typeof useTheme>; hi?: boolean }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: hi ? C.accent : C.textMuted }}>{value}</div>
    </div>
  );
}

function Empty({ C }: { C: ReturnType<typeof useTheme> }) {
  return <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>no data</div>;
}

// ── Page ───────────────────────────────────────────────────────────────────

type Lifetime = { totalSessions: number; totalHrs: number; longestStreak: number; firstDate: string | null };
type Tab      = "sessions" | "exercises" | "volume" | "prs" | "split";

const GOAL      = 200;
const PAGE_SIZE = 10;
const TABS: { key: Tab; label: string }[] = [
  { key: "sessions",  label: "Sessions"  },
  { key: "exercises", label: "Exercises" },
  { key: "volume",    label: "Volume"    },
  { key: "prs",       label: "PRs"       },
  { key: "split",     label: "Split"     },
];

export default function GymPage() {
  const C       = useTheme();
  const curYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(curYear);
  const [tab,          setTab]          = useState<Tab>("sessions");
  const [page,         setPage]         = useState(1);
  const [lifetime,  setLifetime]  = useState<Lifetime | null>(null);
  const [workouts,  setWorkouts]  = useState<HevyWorkoutFull[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [wxLoading, setWxLoading] = useState(false);

  useEffect(() => {
    fetch("/api/hevy/lifetime").then(r => r.json()).then(l => { if (!l.error) setLifetime(l); });
  }, []);

  useEffect(() => {
    setPage(1);
    setWxLoading(true);
    fetch(`/api/hevy/workouts?year=${selectedYear}`).then(r => r.json()).then(w => {
      setWorkouts(w.workouts ?? []);
      setLoading(false); setWxLoading(false);
    }).catch(() => { setLoading(false); setWxLoading(false); });
  }, [selectedYear]);

  const firstYear  = lifetime?.firstDate ? parseInt(lifetime.firstDate.slice(0, 4), 10) : curYear;
  const years      = Array.from({ length: curYear - firstYear + 1 }, (_, i) => curYear - i);
  const dates      = workouts.map(w => w.date);
  const workoutSet = new Set(dates);
  const count      = workouts.length;
  const today      = new Date().toISOString().split("T")[0];
  const loggedToday = selectedYear === curYear && workoutSet.has(today);
  const streak      = selectedYear === curYear ? calcStreak(dates) : 0;
  const progress    = Math.min(100, (count / GOAL) * 100);
  const now         = new Date();
  const weeksInYear = selectedYear === curYear
    ? Math.max(1, Math.ceil((dayOfYear(now) + new Date(curYear, 0, 1).getDay()) / 7))
    : 52;
  const avgPerWeek = (count / weeksInYear).toFixed(1);


  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>Gym</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 18, color: C.textFaint, marginLeft: 10 }}>رياضة</span>
            {loggedToday && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, marginLeft: 14 }}>✓ trained today</span>}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "all-time",       value: lifetime ? String(lifetime.totalSessions) : "—", unit: "sessions" },
              { label: "total time",     value: lifetime ? String(lifetime.totalHrs)      : "—", unit: "hrs"      },
              { label: "longest streak", value: lifetime ? String(lifetime.longestStreak) : "—", unit: "days"     },
              { label: "since",          value: lifetime?.firstDate ? new Date(lifetime.firstDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—", unit: "" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: C.text, lineHeight: 1 }}>
                  {s.value}{s.unit && <span style={{ fontSize: 9, color: C.textFaint, marginLeft: 3 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Year nav + content */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* Year sidebar */}
          <div style={{ width: 44, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                color: selectedYear === y ? C.accent : C.textFaint,
                padding: "5px 0", textAlign: "center", width: "100%", borderRadius: 4, letterSpacing: "0.5px",
              }}>{y}</button>
            ))}
          </div>

          {/* Main */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 28, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
              {[
                { label: "sessions",   value: String(count),   sub: selectedYear === curYear ? `/ ${GOAL}` : undefined, hi: true },
                ...(selectedYear === curYear ? [{ label: "streak",    value: String(streak), sub: "days",     hi: false }] : []),
                { label: "avg / week", value: avgPerWeek,       sub: "sessions", hi: false },
                ...(selectedYear === curYear ? [{ label: "remaining", value: String(Math.max(0, GOAL - count)), sub: "left", hi: false }] : []),
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: s.hi ? C.accent : C.text, lineHeight: 1 }}>
                    {wxLoading ? "—" : s.value}
                    {s.sub && <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 4 }}>{s.sub}</span>}
                  </div>
                </div>
              ))}
            </div>

            {selectedYear === curYear && (
              <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 28 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: C.accent, borderRadius: 2, boxShadow: `0 0 10px ${C.accent}55`, transition: "width .4s" }} />
              </div>
            )}

            {!loading && <GymHeatmap workoutDates={workoutSet} year={selectedYear} />}

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  color: tab === t.key ? C.accent : C.textFaint,
                  padding: "6px 12px", borderRadius: "4px 4px 0 0",
                  borderBottom: `2px solid ${tab === t.key ? C.accent : "transparent"}`,
                  marginBottom: -1,
                }}>{t.label}</button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "sessions" && (() => {
              const pageCount = Math.ceil(count / PAGE_SIZE);
              const paged     = workouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
                      {wxLoading ? "loading…" : `${count} sessions in ${selectedYear}`}
                    </span>
                    <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
                  </div>
                  <div>{paged.map(w => <WorkoutRow key={w.id} w={w} C={C} />)}</div>
                  {!wxLoading && count === 0 && <Empty C={C} />}
                  {pageCount > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                      <Pager page={page} pageCount={pageCount} setPage={setPage} C={C} />
                    </div>
                  )}
                </>
              );
            })()}

            {tab === "exercises" && <ExercisesTab workouts={workouts} C={C} />}
            {tab === "volume"    && <VolumeTab    workouts={workouts} C={C} />}
            {tab === "prs"       && <PRsTab       workouts={workouts} C={C} />}
            {tab === "split"     && <SplitTab     workouts={workouts} C={C} />}

          </div>
        </div>
      </div>
    </div>
  );
}
