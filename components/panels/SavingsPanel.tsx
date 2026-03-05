"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Panel, Tag } from "@/components/ui";

const SAVINGS_KEY    = "hayati-savings";
const SAVINGS_TARGET = 150000;

function loadSaved(): number {
  try { const s = localStorage.getItem(SAVINGS_KEY); return s ? JSON.parse(s) : 0; } catch { return 0; }
}
function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function SavingsPanel() {
  const C = useTheme();
  const [saved,   setSaved]   = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState("");

  useEffect(() => { setSaved(loadSaved()); }, []);

  const commit = () => {
    const val = parseFloat(draft);
    if (!isNaN(val) && val >= 0) {
      setSaved(val);
      try { localStorage.setItem(SAVINGS_KEY, JSON.stringify(val)); } catch {}
    }
    setEditing(false);
  };

  const savePct = Math.min(100, (saved / SAVINGS_TARGET) * 100);

  return (
    <Panel style={{ display: "flex", flexDirection: "column" }}>
      <div className="hayati-drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Tag color={C.textFaint}>Savings</Tag>
        <button
          onClick={() => { setDraft(String(saved)); setEditing(true); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}
        >
          ✎
        </button>
      </div>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          placeholder="current savings..."
          style={{
            background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 5,
            padding: "5px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
            color: C.text, outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 10,
          }}
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
    </Panel>
  );
}
