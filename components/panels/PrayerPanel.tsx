"use client";

import { useTheme } from "@/lib/theme";
import { PRAYER_TIMES } from "@/lib/data";
import { Panel, Tag } from "@/components/ui";

export function PrayerPanel({ time }: { time: Date }) {
  const C = useTheme();
  const curMins = time.getHours()*60+time.getMinutes();
  const nextName = PRAYER_TIMES.find(p=>{ const [h,m]=p.time.split(":").map(Number); return h*60+m>curMins; })?.name;
  return (
    <Panel>
      <Tag color={C.textFaint}>Prayer times</Tag>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:14 }}>
        {PRAYER_TIMES.map((p,i) => {
          const [ph,pm]=p.time.split(":").map(Number), passed=ph*60+pm<curMins, isNext=p.name===nextName;
          return (
            <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:i<PRAYER_TIMES.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.textMuted, textDecoration:passed?"line-through":"none", textDecorationColor:C.textFaint, fontWeight:isNext?700:400 }}>{p.name}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:passed?C.textFaint:isNext?C.accent:C.text, fontWeight:isNext?700:400 }}>{p.time}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
