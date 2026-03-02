"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import type { Transaction } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

const SAVINGS_KEY = "hayati-savings";
const SAVINGS_TARGET = 150000;

function loadTxns(): Transaction[] {
  try { const s = localStorage.getItem("hayati-finance"); return s ? JSON.parse(s) : []; } catch { return []; }
}
function loadSaved(): number {
  try { const s = localStorage.getItem(SAVINGS_KEY); return s ? JSON.parse(s) : 0; } catch { return 0; }
}
function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function FinancePanel() {
  const C = useTheme();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [saved, setSaved] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => { setTxns(loadTxns()); setSaved(loadSaved()); }, []);

  const now = new Date();
  const monthTxns = txns.filter(t => {
    const d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const income   = monthTxns.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxns.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
  const net      = income - expenses;
  const savePct  = Math.min(100, (saved / SAVINGS_TARGET) * 100);

  const commitSaved = () => {
    const val = parseFloat(draft);
    if (!isNaN(val) && val >= 0) {
      setSaved(val);
      try { localStorage.setItem(SAVINGS_KEY, JSON.stringify(val)); } catch {}
    }
    setEditing(false);
  };

  return (
    <Panel style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tag color={C.textFaint}>Finance</Tag>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
          {now.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Month summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        {[
          { label: "income",   val: fmt(income),                                color: C.teal  },
          { label: "expenses", val: fmt(expenses),                              color: C.red   },
          { label: "net",      val: (net >= 0 ? "+" : "") + fmt(net),           color: net >= 0 ? C.accent : C.red },
        ].map(s => (
          <div key={s.label} style={{ flex: 1 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Savings goal */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.5px", textTransform: "uppercase" }}>saved · goal 150k</div>
          <button onClick={() => { setDraft(String(saved)); setEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>✎</button>
        </div>

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitSaved}
            onKeyDown={e => { if (e.key === "Enter") commitSaved(); if (e.key === "Escape") setEditing(false); }}
            placeholder="current savings..."
            style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 10 }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{fmt(saved)}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>/ {fmt(SAVINGS_TARGET)}</span>
          </div>
        )}

        <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${savePct}%`, background: C.accent, borderRadius: 2, boxShadow: `0 0 8px ${C.accent}55`, transition: "width .3s" }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 5 }}>
          {fmt(SAVINGS_TARGET - saved)} remaining · {savePct.toFixed(1)}%
        </div>
      </div>
    </Panel>
  );
}
