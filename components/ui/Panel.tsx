"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export function Panel({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const C = useTheme();
  return (
    <div onClick={onClick} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20, position:"relative", overflow:"hidden", ...style, height:"100%" }}>
      {children}
    </div>
  );
}
