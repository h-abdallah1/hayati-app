"use client";

import { useTheme } from "@/lib/theme";

type C = ReturnType<typeof useTheme>;

export function Pager({ page, pageCount, setPage, C }: {
  page: number; pageCount: number;
  setPage: (fn: (p: number) => number) => void;
  C: C;
}) {
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

export function Stat({ label, value, C, hi }: { label: string; value: string; C: C; hi?: boolean }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: C.textFaint, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: hi ? C.accent : C.textMuted }}>{value}</div>
    </div>
  );
}

export function Empty({ C }: { C: C }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, textAlign: "center", padding: "48px 0" }}>
      no data
    </div>
  );
}

export function Sparkline({ history, C }: { history: { weight: number }[]; C: C }) {
  if (history.length < 2) return null;
  const W = 96, H = 22;
  const weights = history.map(h => h.weight);
  const lo = Math.min(...weights), hi = Math.max(...weights);
  const rangeY = hi - lo || 1;
  const px = (i: number) => (i / (history.length - 1)) * W;
  const py = (i: number) => H - 2 - ((weights[i] - lo) / rangeY) * (H - 4);
  const pts = history.map((_, i) => `${px(i)},${py(i)}`).join(" ");
  const lastX = px(history.length - 1), lastY = py(history.length - 1);
  return (
    <svg width={W} height={H} style={{ display: "block", flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={`${C.accent}70`} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={C.accent} />
    </svg>
  );
}
