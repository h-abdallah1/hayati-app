"use client";

import { useTheme } from "@/lib/theme";

export function Dot({ color, size = 6 }: { color?: string; size?: number }) {
  const C = useTheme();
  const c = color ?? C.accent;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:c, boxShadow:`0 0 ${size*1.5}px ${c}88`, flexShrink:0 }} />;
}
