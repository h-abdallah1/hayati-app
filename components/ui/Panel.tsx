"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const C = useTheme();
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20, position:"relative", overflow:"hidden", ...style }}>
      {children}
    </div>
  );
}
