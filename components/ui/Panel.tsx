"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export const Panel = React.forwardRef<HTMLDivElement, { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }>(
  ({ children, style = {}, onClick }, ref) => {
    const C = useTheme();
    return (
      <div ref={ref} onClick={onClick} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20, position:"relative", overflow:"hidden", ...style, height:"100%" }}>
        {children}
      </div>
    );
  }
);
Panel.displayName = "Panel";
