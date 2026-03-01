"use client";

import { useTheme } from "@/lib/theme";
import { useQuranVerse } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";

export function QuranPanel() {
  const C = useTheme();
  const verse = useQuranVerse();
  return (
    <Panel style={{ gridColumn:"span 2" }}>
      <div style={{ position:"absolute", bottom:-10, right:12, fontFamily:"'Scheherazade New',serif", fontSize:80, color:C.accent, opacity:0.04, lineHeight:1, pointerEvents:"none", userSelect:"none", direction:"rtl" }}>{"٣٥١"}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <Tag color={C.textFaint}>{"Quran · verse of the day"}</Tag>
        {verse ? (
          <a href={verse.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", cursor:"pointer", display:"flex", lineHeight:1 }}>
            <Tag color={C.textFaint}>{verse.ref} ↗</Tag>
          </a>
        ) : (
          <Tag color={C.textFaint}>—</Tag>
        )}
      </div>
      {verse ? (
        <>
          <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:22, color:C.text, direction:"rtl", textAlign:"right", lineHeight:1.8, marginBottom:14 }}>{verse.arabic}</div>
          <div style={{ height:1, background:C.border, marginBottom:12 }} />
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textMuted, lineHeight:1.7, fontStyle:"italic" }}>"{verse.translation}"</div>
        </>
      ) : (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textFaint }}>loading…</div>
      )}
    </Panel>
  );
}
