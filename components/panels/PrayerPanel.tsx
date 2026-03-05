"use client";

import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { getPrayerTimes, useQuranVerse } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";

export function PrayerPanel({ time }: { time: Date }) {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const verse = useQuranVerse();
  const PRAYER_TIMES = getPrayerTimes(global.location, global.timeFormat, global.prayerMethod);
  const curMins = time.getHours()*60+time.getMinutes();
  const nextName = PRAYER_TIMES.find(p => p.mins > curMins)?.name;

  return (
    <Panel style={{ display:"flex", flexDirection:"column" }}>
      <div className="hayati-drag-handle" style={{ display:"inline-flex" }}><Tag color={C.textFaint}>Prayer times</Tag></div>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:10 }}>
        {PRAYER_TIMES.map((p, i) => {
          const passed = p.mins < curMins, isNext = p.name === nextName;
          return (
            <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<PRAYER_TIMES.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.textMuted, textDecoration:passed?"line-through":"none", textDecorationColor:C.textFaint, fontWeight:isNext?700:400 }}>{p.name}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.text, fontWeight:isNext?700:400 }}>{p.time}</span>
            </div>
          );
        })}
      </div>

      {/* Quran verse */}
      <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <Tag color={C.textFaint}>verse of the day</Tag>
          {verse && (
            <a href={verse.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
              <Tag color={C.textFaint}>{verse.ref} ↗</Tag>
            </a>
          )}
        </div>
        {verse ? (
          <>
            <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:18, color:C.text, direction:"rtl", textAlign:"right", lineHeight:1.8, marginBottom:10 }}>{verse.arabic}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted, lineHeight:1.7, fontStyle:"italic" }}>"{verse.translation}"</div>
          </>
        ) : (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>loading…</div>
        )}
      </div>
    </Panel>
  );
}
