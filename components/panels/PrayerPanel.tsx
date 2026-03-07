"use client";

import { useRef } from "react";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { getPrayerTimes, usePanelSize } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";

export function PrayerPanel({ time }: { time: Date }) {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const { global } = useGlobalSettings();
  const PRAYER_TIMES = getPrayerTimes(global.location, global.timeFormat, global.prayerMethod);
  const curMins = time.getHours()*60+time.getMinutes();
  const nextName = PRAYER_TIMES.find(p => p.mins > curMins)?.name;

  const rowPadding = height > 0 && height < 280 ? "2px 0" : "5px 0";

  return (
    <Panel ref={ref} style={{ display:"flex", flexDirection:"column" }}>
      <div className="hayati-drag-handle" style={{ display:"inline-flex" }}><Tag color={C.textFaint}>Prayer times</Tag></div>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:10 }}>
        {PRAYER_TIMES.map((p, i) => {
          const passed = p.mins < curMins, isNext = p.name === nextName;
          return (
            <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:rowPadding, borderBottom:i<PRAYER_TIMES.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.textMuted, textDecoration:passed?"line-through":"none", textDecorationColor:C.textFaint, fontWeight:isNext?700:400 }}>{p.name}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.text, fontWeight:isNext?700:400 }}>{p.time}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
