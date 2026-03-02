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

export function GymSkeleton({ C }: { C: C }) {
  const blk = (w: number | string, h: number, delay = 0): React.CSSProperties => ({
    display: "block", width: w, height: h, background: C.border, animationDelay: `${delay}s`,
  });
  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 28, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        {([42, 36, 50, 40] as number[]).map((w, i) => (
          <div key={i}>
            <span className="gym-skel" style={blk(w, 7, i * 0.1)} />
            <div style={{ height: 5 }} />
            <span className="gym-skel" style={blk(w * 0.7, 18, i * 0.1 + 0.05)} />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.border, borderRadius: 2, marginBottom: 28, opacity: 0.35 }} />

      {/* Heatmap: month labels */}
      <div style={{ display: "flex", gap: 10, marginBottom: 7, paddingLeft: 16 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="gym-skel" style={blk(22, 8, i * 0.04)} />
        ))}
      </div>
      {/* Heatmap: grid block */}
      <span className="gym-skel" style={{ ...blk("100%", 90), display: "block", borderRadius: 4, marginBottom: 28 }} />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        {([60, 56, 68, 52, 36, 40] as number[]).map((w, i) => (
          <span key={i} className="gym-skel" style={{ ...blk(w, 24, i * 0.08), borderRadius: 4 }} />
        ))}
      </div>

      {/* Content rows */}
      {[1, 0.8, 0.6, 0.45, 0.3].map((op, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center", opacity: op }}>
          <span className="gym-skel" style={blk(88, 9, i * 0.1)} />
          <span className="gym-skel" style={{ display: "block", flex: 1, height: 9, background: C.border, borderRadius: 3, animationDelay: `${i * 0.1 + 0.05}s` }} />
          <span className="gym-skel" style={blk(48, 9, i * 0.1 + 0.1)} />
        </div>
      ))}
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
