"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import type { Goal } from "@/lib/types";

type Status = Goal["status"];

// ── Year progress helpers ──────────────────────────────────────────────────

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOfYear(date: Date): number {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_ABBR    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function dayLabel(year: number, d: number): string {
  const date = new Date(year, 0, d);
  return `${DAY_ABBR[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

// Returns the grid-column index (0-based) where each month begins
function monthStartCols(jan1DOW: number, leap: boolean): number[] {
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const cols: number[] = [];
  let idx = jan1DOW;
  for (const d of days) { cols.push(Math.floor(idx / 7)); idx += d; }
  return cols;
}

function StatBox({
  label, value, sub, hi, C,
}: {
  label: string; value: string; sub?: string; hi?: boolean;
  C: ReturnType<typeof useTheme>;
}) {
  return (
    <div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
        color: C.textFaint, letterSpacing: "0.6px",
        textTransform: "uppercase", marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 20,
        color: hi ? C.accent : C.text, lineHeight: 1,
      }}>
        {value}
        {sub && (
          <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 4 }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
const SHOW_DAY     = new Set([1, 3, 5]); // Mon, Wed, Fri

function YearProgress({ year }: { year: number }) {
  const C       = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [sq, setSq] = useState(10);

  const GAP  = 3;  // gap between squares (px)
  const DL_W = 10; // day-label column width (px)
  const DL_G = 6;  // gap between day labels and grid (px)

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

  const now         = new Date();
  const currentYear = now.getFullYear();
  const leap        = isLeapYear(year);
  const total       = leap ? 366 : 365;

  const today =
    year < currentYear ? total + 1 :
    year > currentYear ? 0         :
    dayOfYear(now);

  const refDate = year < currentYear ? new Date(year, 11, 31)
                : year > currentYear ? new Date(year, 0, 1)
                : now;
  const jan1DOW = new Date(year, 0, 1).getDay();
  const weekNum = year < currentYear ? 52
                : year > currentYear ? 1
                : Math.ceil((today + jan1DOW) / 7);
  const quarter    = Math.ceil((refDate.getMonth() + 1) / 3);
  const displayDay = Math.min(today, total);
  const pct        = ((displayDay / total) * 100).toFixed(1);

  const mCols   = monthStartCols(jan1DOW, leap);
  const step    = sq + GAP;                           // px per column stride
  const BR      = Math.max(1, Math.round(sq * 0.2)); // proportional corner radius
  const pulse   = Math.max(2, Math.round(sq * 0.35));

  return (
    <div style={{ marginBottom: 28 }}>
      <style>{`
        @keyframes todayPulse {
          0%, 100% { box-shadow: 0 0 0 0px ${C.accent}60; }
          55%       { box-shadow: 0 0 0 ${pulse}px ${C.accent}1e; }
        }
        .today-sq { animation: todayPulse 2.6s ease-in-out infinite; }
      `}</style>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 28, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
        <StatBox label="day of year" value={String(displayDay)}              sub={`/ ${total}`} C={C} />
        <StatBox label="remaining"   value={String(total - displayDay)} sub="days"         C={C} />
        <StatBox label="complete"    value={`${pct}%`}             hi                 C={C} />
        <StatBox label="week"        value={String(weekNum)}       sub="/ 52"         C={C} />
        <StatBox label="quarter"     value={`Q${quarter}`}                            C={C} />
      </div>

      {/* Grid wrapper — drives sq measurement */}
      <div ref={wrapRef} style={{ width: "100%" }}>

        {/* Month labels — offset left by the day-label column */}
        <div style={{ paddingLeft: DL_W + DL_G, position: "relative", height: 14, marginBottom: 5 }}>
          {mCols.map((col, m) => (
            <span key={m} style={{
              position: "absolute",
              left: col * step,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: C.textFaint,
              letterSpacing: "0.2px",
              userSelect: "none",
            }}>
              {MONTH_NAMES[m].slice(0, 3).toLowerCase()}
            </span>
          ))}
        </div>

        {/* Day-of-week labels + squares side by side */}
        <div style={{ display: "flex", gap: DL_G, alignItems: "flex-start" }}>

          {/* M / W / F labels */}
          <div style={{
            display: "grid",
            gridTemplateRows: `repeat(7, ${sq}px)`,
            gap: GAP,
            width: DL_W,
            flexShrink: 0,
          }}>
            {DAY_INITIALS.map((l, i) => (
              <div key={i} style={{
                height: sq,
                display: "flex",
                alignItems: "center",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: Math.min(9, Math.max(7, Math.round(sq * 0.65))),
                color: SHOW_DAY.has(i) ? C.textFaint : "transparent",
                lineHeight: 1,
                userSelect: "none",
              }}>
                {l}
              </div>
            ))}
          </div>

          {/* The 365 squares */}
          <div style={{
            display: "grid",
            gridTemplateRows: `repeat(7, ${sq}px)`,
            gridAutoColumns: `${sq}px`,
            gridAutoFlow: "column",
            gap: GAP,
          }}>
            {Array.from({ length: jan1DOW }).map((_, i) => (
              <div key={`o${i}`} style={{ width: sq, height: sq }} />
            ))}
            {Array.from({ length: total }).map((_, i) => {
              const d       = i + 1;
              const isToday = year === currentYear && d === today;
              const past    = d < today;
              return (
                <div
                  key={d}
                  title={`${dayLabel(year, d)} · day ${d}`}
                  className={isToday ? "today-sq" : undefined}
                  style={{
                    width: sq, height: sq,
                    borderRadius: BR,
                    background: isToday
                      ? C.accent
                      : past
                      ? `${C.accent}50`
                      : C.border,
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

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all",    label: "all"    },
  { key: "active", label: "active" },
  { key: "todo",   label: "to-do"  },
  { key: "done",   label: "done"   },
];

const STATUS_ICON: Record<Status, string>  = { todo: "○", active: "◑", done: "●" };
const STATUS_CYCLE: Record<Status, Status> = { todo: "active", active: "done", done: "todo" };

const goalYear = (g: Goal) => g.year ?? new Date(g.created).getFullYear();

const INITIAL: Goal[] = [
  { id: 1, title: "Read 20 books this year", status: "active", description: "Focus on non-fiction and Islamic literature", created: new Date().toISOString() },
  { id: 2, title: "Daily Arabic practice",   status: "todo",   created: new Date().toISOString() },
  { id: 3, title: "Finish CSS course",       status: "done",   created: new Date().toISOString() },
];

const SEED_2024: Goal[] = [
  { id: 20240001, title: "Finish 2024 Curriculum",                                 status: "todo", year: 2024, description: "did not do this as I have deviated from that path",           created: "2024-01-01T00:00:00.000Z" },
  { id: 20240002, title: "Get started on personal art projects — aim for 10",      status: "todo", year: 2024, description: "did not do this but definitely getting there",                created: "2024-01-01T00:00:00.000Z" },
  { id: 20240003, title: "Save 70,000 dhs in Sarwa and/or other investments",      status: "todo", year: 2024, description: "Saved half of that, I'll take it",                           created: "2024-01-01T00:00:00.000Z" },
  { id: 20240004, title: "Get a visa and set the groundwork for relocating abroad", status: "todo", year: 2024, description: "didn't but I tried my best (UK, Canada, or other)",          created: "2024-01-01T00:00:00.000Z" },
  { id: 20240005, title: "Finish 2 sketchbooks (or 200 sketches)",                 status: "done", year: 2024, description: "didn't finish 2 sketchbooks but did around 150+ sketches",   created: "2024-01-01T00:00:00.000Z" },
  { id: 20240006, title: "Read 10 books",                                           status: "done", year: 2024,                                                                             created: "2024-01-01T00:00:00.000Z" },
  { id: 20240007, title: "Do LASIK",                                                status: "done", year: 2024,                                                                             created: "2024-01-01T00:00:00.000Z" },
  { id: 20240008, title: "Go debt free",                                            status: "done", year: 2024,                                                                             created: "2024-01-01T00:00:00.000Z" },
];

const SEED_2025: Goal[] = [
  { id: 20250001, title: "Save 100k DHS in Sarwa",                                                    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250002, title: "Get good enough to play a tough song on drums",                              status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250003, title: "Finish Bridgman Complete Guide to Drawing from Life",                        status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250004, title: "Finish 3 other art books",                                                   status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250005, title: "Spend another year drawing consistently",                                    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250006, title: "Learn to draw from imagination",                                             status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250007, title: "Draw 300+ pages of sketches/drawings",                                       status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250008, title: "Release a game with Hod",                                                    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250009, title: "Get a sick ass tattoo on either my right shoulder or my left forearm",       status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250010, title: "Finish the old drawing curriculum — or finish Drawabox", optional: true,    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250011, title: "Travel to the UK and Australia",                                             status: "done", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250012, title: "Get jacked — hit 92kg and finish the lean bulk",                             status: "done", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250013, title: "Apply for an Australian PR and visa",                                        status: "done", year: 2025, created: "2025-01-01T00:00:00.000Z" },
];

const SEED_2026: Goal[] = [
  { id: 20260001, title: "Create a website for my photography portfolio", status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260002, title: "Finish one junk journal",                       status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260003, title: "Do 1 push up a day everyday",                   status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260004, title: "Save 150k",                                     status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260005, title: "Make less impulse purchases",                   status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260006, title: "Finish 2026 with 0 debt",                       status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260007, title: "Order takeout less",                            status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260008, title: "Do 200 gym sessions",                           status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260009, title: "Minimize soda intake",                          status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260010, title: "Watch 30 movies",                               status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260011, title: "Draw for 200 hrs or do 200 sketches",           status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260012, title: "Read 10 books, learn 3 topics",                 status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260013, title: "Release a game on Steam",                       status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260014, title: "Write a song with Tala",                        status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260015, title: "Pray more",                                     status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260016, title: "Journal more",                                  status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260017, title: "Get engaged",                                   status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260018, title: "Learn to live life more and to let go more often — trust the process", status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
];

const ALL_SEEDS = [...SEED_2024, ...SEED_2025, ...SEED_2026];

// Patches applied to already-persisted seeded goals (title fixes, field additions)
const SEED_PATCHES: Record<number, Partial<Goal>> = {
  20250010: { title: "Finish the old drawing curriculum — or finish Drawabox", optional: true },
};

function load(): Goal[] {
  try {
    const s = localStorage.getItem("hayati-goals");
    const existing: Goal[] = s ? JSON.parse(s) : INITIAL;
    const existingIds = new Set(existing.map(g => g.id));
    const toAdd = ALL_SEEDS.filter(g => !existingIds.has(g.id));
    const patched = existing.map(g => SEED_PATCHES[g.id] ? { ...g, ...SEED_PATCHES[g.id] } : g);
    const merged = [...patched, ...toAdd];
    if (toAdd.length || patched.some((g, i) => g !== existing[i])) {
      try { localStorage.setItem("hayati-goals", JSON.stringify(merged)); } catch {}
    }
    return merged;
  } catch {}
  return [...INITIAL, ...ALL_SEEDS];
}
function persist(goals: Goal[]) {
  try { localStorage.setItem("hayati-goals", JSON.stringify(goals)); } catch {}
}

export default function GoalsPage() {
  const C = useTheme();

  const [goals,        setGoals]       = useState<Goal[]>(INITIAL);
  const [filter,       setFilter]      = useState<Status | "all">("all");
  const [adding,       setAdding]      = useState(false);
  const [title,        setTitle]       = useState("");
  const [desc,         setDesc]        = useState("");
  const [optional,     setOptional]    = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [draggingId,   setDraggingId]  = useState<number | null>(null);
  const [overIdx,      setOverIdx]     = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);

  useEffect(() => { setGoals(load()); }, []);

  const update = (next: Goal[]) => { setGoals(next); persist(next); };

  const cycleStatus = (id: number) =>
    update(goals.map(g => g.id === id ? { ...g, status: STATUS_CYCLE[g.status] } : g));

  const remove = (id: number) => update(goals.filter(g => g.id !== id));

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const reordered = [...visible];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(from < to ? to - 1 : to, 0, moved);
    const ids = new Set(visible.map(g => g.id));
    const positions: number[] = [];
    goals.forEach((g, i) => { if (ids.has(g.id)) positions.push(i); });
    const next = [...goals];
    positions.forEach((pos, i) => { next[pos] = reordered[i]; });
    update(next);
  };

  const addGoal = () => {
    if (!title.trim()) return;
    update([...goals, {
      id: Date.now(), title: title.trim(),
      ...(optional ? { optional: true } : {}),
      year: selectedYear,
      status: "todo", description: desc.trim() || undefined,
      created: new Date().toISOString(),
    }]);
    setTitle(""); setDesc(""); setOptional(false); setAdding(false);
  };

  const currentYear = new Date().getFullYear();
  const years = [...new Set([
    currentYear,
    currentYear - 1,
    currentYear - 2,
    ...goals.map(goalYear),
  ])].sort((a, b) => b - a);

  const visible = (filter === "all" ? goals : goals.filter(g => g.status === filter))
    .filter(g => goalYear(g) === selectedYear);

  const inputBase: React.CSSProperties = {
    background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 6,
    padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11, color: C.text, outline: "none", width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: C.text }}>Goals</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 18, color: C.textFaint, marginLeft: 10 }}>أهداف</span>
          </div>
          <button
            onClick={() => setAdding(true)}
            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted, padding: "5px 12px" }}
          >
            + add goal
          </button>
        </div>

        {/* Year nav + main content */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* Year nav sidebar */}
          <div style={{ width: 44, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                color: selectedYear === y ? C.accent : C.textFaint,
                padding: "5px 0", textAlign: "center", width: "100%", borderRadius: 4,
                letterSpacing: "0.5px",
              }}>
                {y}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>

        <YearProgress year={selectedYear} />

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              background: filter === f.key ? C.surfaceHi : "none",
              border: `1px solid ${filter === f.key ? C.border : "transparent"}`,
              borderRadius: 5, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              color: filter === f.key ? C.text : C.textFaint,
              padding: "4px 10px", letterSpacing: "0.5px",
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Add form */}
        {adding && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="goal title..." autoFocus
              onKeyDown={e => { if (e.key === "Enter") addGoal(); if (e.key === "Escape") setAdding(false); }}
              style={inputBase}
            />
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="description (optional)"
              onKeyDown={e => { if (e.key === "Enter") addGoal(); if (e.key === "Escape") setAdding(false); }}
              style={inputBase}
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setOptional(o => !o)} style={{
                background: optional ? C.textFaint + "18" : "none",
                border: `1px solid ${optional ? C.textFaint : C.border}`,
                borderRadius: 5, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                color: optional ? C.textMuted : C.textFaint, padding: "4px 8px",
              }}>
                optional
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={addGoal} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, padding: "4px 12px" }}>add</button>
              <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: "4px 6px" }}>✕</button>
            </div>
          </div>
        )}

        {/* Goals list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {visible.length === 0 && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>
              no goals yet
            </div>
          )}
          {visible.map((g, i) => (
            <div
              key={g.id}
              draggable
              onDragStart={e => { e.dataTransfer.effectAllowed = "move"; dragFrom.current = i; setDraggingId(g.id); }}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverIdx(i); }}
              onDrop={e => { e.preventDefault(); if (dragFrom.current !== null) reorder(dragFrom.current, i); dragFrom.current = null; setDraggingId(null); setOverIdx(null); }}
              onDragEnd={() => { dragFrom.current = null; setDraggingId(null); setOverIdx(null); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 0 12px",
                borderTop: overIdx === i ? `2px solid ${C.accent}` : "2px solid transparent",
                borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none",
                opacity: draggingId === g.id ? 0.35 : 1,
                cursor: "grab", userSelect: "none",
              }}
            >
              {/* Status toggle */}
              <button
                onClick={() => cycleStatus(g.id)}
                title="click to cycle status"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                  color: g.status === "done" ? C.textFaint : g.status === "active" ? C.accent : C.textMuted,
                  padding: 0, marginTop: 1, flexShrink: 0,
                }}
              >
                {STATUS_ICON[g.status]}
              </button>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                  color: g.status === "done" ? C.textFaint : C.text,
                  textDecoration: g.status === "done" ? "line-through" : "none",
                  textDecorationColor: C.textFaint,
                }}>
                  {g.title}
                </span>
                {g.description && (
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginTop: 3 }}>
                    {g.description}
                  </div>
                )}
              </div>

              {/* Optional badge */}
              {g.optional && (
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: C.textFaint,
                  background: C.textFaint + "14",
                  border: `1px solid ${C.textFaint}33`,
                  borderRadius: 4, padding: "2px 6px", flexShrink: 0, marginTop: 2,
                }}>
                  optional
                </span>
              )}

              {/* Remove */}
              <button
                onClick={() => remove(g.id)}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: 0, flexShrink: 0, opacity: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0"; }}
              >
                ✕
              </button>
            </div>
          ))}
          {/* Trailing drop zone — drop after last item */}
          {visible.length > 0 && (
            <div
              onDragOver={e => { e.preventDefault(); setOverIdx(visible.length); }}
              onDrop={e => { e.preventDefault(); if (dragFrom.current !== null) reorder(dragFrom.current, visible.length); dragFrom.current = null; setDraggingId(null); setOverIdx(null); }}
              style={{ height: 16, borderTop: overIdx === visible.length ? `2px solid ${C.accent}` : "2px solid transparent" }}
            />
          )}
        </div>

          </div>{/* end main content */}
        </div>{/* end year nav + main content flex row */}

      </div>
    </div>
  );
}
