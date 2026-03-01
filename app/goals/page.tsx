"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import type { Goal } from "@/lib/types";

type Timeframe = Goal["timeframe"];
type Status    = Goal["status"];

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "1mo",     label: "1 month"  },
  { key: "3mo",     label: "3 months" },
  { key: "6mo",     label: "6 months" },
  { key: "1yr",     label: "1 year"   },
  { key: "ongoing", label: "ongoing"  },
];

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all",    label: "all"    },
  { key: "active", label: "active" },
  { key: "todo",   label: "to-do"  },
  { key: "done",   label: "done"   },
];

const STATUS_ICON: Record<Status, string>  = { todo: "○", active: "◑", done: "●" };
const STATUS_CYCLE: Record<Status, Status> = { todo: "active", active: "done", done: "todo" };

const INITIAL: Goal[] = [
  { id: 1, title: "Read 20 books this year",  timeframe: "1yr",  status: "active", description: "Focus on non-fiction and Islamic literature", created: new Date().toISOString() },
  { id: 2, title: "Daily Arabic practice",    timeframe: "3mo",  status: "todo",   created: new Date().toISOString() },
  { id: 3, title: "Finish CSS course",        timeframe: "1mo",  status: "done",   created: new Date().toISOString() },
];

function load(): Goal[] {
  try { const s = localStorage.getItem("hayati-goals"); if (s) return JSON.parse(s); } catch {}
  return INITIAL;
}
function persist(goals: Goal[]) {
  try { localStorage.setItem("hayati-goals", JSON.stringify(goals)); } catch {}
}

export default function GoalsPage() {
  const C = useTheme();

  const TF_COLOR: Record<Timeframe, string> = {
    "1mo": C.amber, "3mo": C.teal, "6mo": C.blue, "1yr": C.accent, "ongoing": C.textMuted,
  };

  const [goals,   setGoals]  = useState<Goal[]>(INITIAL);
  const [filter,  setFilter] = useState<Status | "all">("all");
  const [adding,  setAdding] = useState(false);
  const [title,   setTitle]  = useState("");
  const [desc,    setDesc]   = useState("");
  const [tf,      setTf]     = useState<Timeframe>("3mo");

  useEffect(() => { setGoals(load()); }, []);

  const update = (next: Goal[]) => { setGoals(next); persist(next); };

  const cycleStatus = (id: number) =>
    update(goals.map(g => g.id === id ? { ...g, status: STATUS_CYCLE[g.status] } : g));

  const remove = (id: number) => update(goals.filter(g => g.id !== id));

  const addGoal = () => {
    if (!title.trim()) return;
    update([...goals, {
      id: Date.now(), title: title.trim(), timeframe: tf,
      status: "todo", description: desc.trim() || undefined,
      created: new Date().toISOString(),
    }]);
    setTitle(""); setDesc(""); setTf("3mo"); setAdding(false);
  };

  const visible = filter === "all" ? goals : goals.filter(g => g.status === filter);

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
              {TIMEFRAMES.map(t => (
                <button key={t.key} onClick={() => setTf(t.key)} style={{
                  background: tf === t.key ? TF_COLOR[t.key] + "22" : "none",
                  border: `1px solid ${tf === t.key ? TF_COLOR[t.key] : C.border}`,
                  borderRadius: 5, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: tf === t.key ? TF_COLOR[t.key] : C.textFaint, padding: "4px 8px",
                }}>
                  {t.key}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={addGoal} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, padding: "4px 12px" }}>add</button>
              <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: "4px 6px" }}>✕</button>
            </div>
          </div>
        )}

        {/* Goals list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {visible.length === 0 && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>
              no goals yet
            </div>
          )}
          {visible.map((g, i) => (
            <div key={g.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none" }}>
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

              {/* Timeframe badge */}
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                color: TF_COLOR[g.timeframe],
                background: TF_COLOR[g.timeframe] + "18",
                border: `1px solid ${TF_COLOR[g.timeframe]}44`,
                borderRadius: 4, padding: "2px 6px", flexShrink: 0, marginTop: 2,
              }}>
                {g.timeframe}
              </span>

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
        </div>

      </div>
    </div>
  );
}
