import React from "react";
import { C } from "@/lib/design";

export function Tag({ children, color = C.textFaint }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:400, letterSpacing:"1.5px", textTransform:"uppercase", color }}>{children}</span>;
}
