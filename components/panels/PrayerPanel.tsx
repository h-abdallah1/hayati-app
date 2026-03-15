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

  const smPray = height > 0 && height < 280;
  const rowPb = smPray ? 10 : 18;

  return (
    <Panel ref={ref} style={{ display:"flex", flexDirection:"column", padding: 14 }}>
      <div className="hayati-drag-handle" style={{ display:"inline-flex", marginBottom: smPray ? 8 : 10 }}><Tag color={C.textFaint}>Prayer times</Tag></div>
      <div style={{ display:"flex", flexDirection:"column" }}>
        {PRAYER_TIMES.map((p, i) => {
          const passed = p.mins < curMins, isNext = p.name === nextName;
          const notLast = i < PRAYER_TIMES.length - 1;
          const nameColor = passed ? C.textFaint : isNext ? C.accent : C.textMuted;
          const timeColor = passed ? C.textFaint : isNext ? C.accent : C.text;
          return (
            <div key={p.name} style={{ display:"flex", gap:10 }}>
              {/* dot + line column */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0 }}>
                <div style={{ paddingTop:2 }}>
                  {isNext ? (
                    <div style={{ width:10, height:10, borderRadius:"50%", background:C.accent, boxShadow:`0 0 8px ${C.accent}88` }} />
                  ) : passed ? (
                    <div style={{ width:7, height:7, borderRadius:"50%", background:C.textFaint }} />
                  ) : (
                    <div style={{ width:7, height:7, borderRadius:"50%", border:`1.5px solid ${C.border}` }} />
                  )}
                </div>
                {notLast && <div style={{ flex:1, width:1, background:C.border, marginTop:4 }} />}
              </div>
              {/* name + time */}
              <div style={{ display:"flex", justifyContent:"space-between", flex:1, paddingBottom: notLast ? rowPb : 0 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:nameColor, fontWeight:isNext?700:400 }}>{p.name}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:timeColor, fontWeight:isNext?700:400 }}>{p.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
