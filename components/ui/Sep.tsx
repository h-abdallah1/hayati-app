"use client";

import { useTheme } from "@/lib/theme";

export function Sep() {
  const C = useTheme();
  return <div style={{ width:1, height:14, background:C.border }} />;
}
