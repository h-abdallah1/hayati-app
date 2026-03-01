"use client";

import { useTheme } from "@/lib/theme";

export function Stat({ icon, label, color, dim }: { icon?: string; label: string; color?: string; dim?: boolean }) {
  const C = useTheme();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      {icon && <span style={{ fontSize:11, opacity:0.7 }}>{icon}</span>}
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:color||(dim?C.textFaint:C.textMuted), letterSpacing:"0.2px" }}>{label}</span>
    </div>
  );
}
