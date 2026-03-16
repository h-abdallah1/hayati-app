"use client";

import React from "react";
import { useThemeToggle } from "@/lib/theme";

export const Panel = React.forwardRef<HTMLDivElement, { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }>(
  ({ children, style = {}, onClick }, ref) => {
    const { isDark } = useThemeToggle();

    const glassStyle: React.CSSProperties = isDark
      ? {
          background: "rgba(20, 20, 20, 0.45)",
          backdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.10)",
            "0 1px 1px rgba(0,0,0,0.15)",
            "0 8px 32px rgba(0,0,0,0.35)",
          ].join(", "),
        }
      : {
          background: "rgba(255,255,255,0.58)",
          backdropFilter: "blur(24px) saturate(1.8) brightness(1.02)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8) brightness(1.02)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.85)",
            "0 1px 1px rgba(0,0,0,0.04)",
            "0 8px 32px rgba(0,0,0,0.08)",
          ].join(", "),
        };

    return (
      <div
        ref={ref}
        onClick={onClick}
        style={{
          borderRadius: 12,
          padding: 20,
          position: "relative",
          overflow: "hidden",
          height: "100%",
          ...glassStyle,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);
Panel.displayName = "Panel";
