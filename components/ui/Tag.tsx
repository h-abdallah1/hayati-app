"use client";

import React from "react";
import { useTheme } from "@/lib/theme";

export function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  const C = useTheme();
  return <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:400, letterSpacing:"1.5px", textTransform:"uppercase", color:color??C.textFaint }}>{children}</span>;
}
