import type { CSSProperties } from "react";
import type { useTheme } from "@/lib/theme";

type Theme = ReturnType<typeof useTheme>;

export const inputStyle = (C: Theme): CSSProperties => ({
  background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 6,
  padding: "6px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
  color: C.text, outline: "none", width: "100%", boxSizing: "border-box",
});

export const fieldLabel = (C: Theme): CSSProperties => ({
  fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint,
  letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4, display: "block",
});

export const sectionHead = (C: Theme): CSSProperties => ({
  fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, color: C.textMuted,
  letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12, marginTop: 20,
  paddingBottom: 6, borderBottom: `1px solid ${C.border}`,
});

export const btnSmall = (C: Theme): CSSProperties => ({
  background: "none", border: "none", cursor: "pointer", color: C.textFaint,
  fontSize: 12, padding: "0 3px", flexShrink: 0, lineHeight: 1,
});

export const addBtn = (C: Theme): CSSProperties => ({
  background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent,
  padding: "5px 10px", flexShrink: 0,
});

export const cancelBtn = (C: Theme): CSSProperties => ({
  background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint,
  padding: "5px 10px", flexShrink: 0,
});

export const ghostBtn = (C: Theme, loading: boolean): CSSProperties => ({
  background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer",
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted,
  padding: "5px 10px", flexShrink: 0,
  opacity: loading ? 0.5 : 1,
});
