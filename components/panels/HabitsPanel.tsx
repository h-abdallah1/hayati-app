"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { HABITS_DATA, D_SHORT } from "@/lib/data";
import { Panel, Tag } from "@/components/ui";

export function HabitsPanel({ time }: { time: Date }) {
  const C = useTheme();
  const [habits, setHabits] = useState(HABITS_DATA);
  const today = time.getDay();
  const toggle = (hi: number, di: number) => setHabits(prev => prev.map((h,i) => i===hi ? {...h, done:h.done.map((d,j)=>j===di?(d?0:1):d)} : h));
  return (
    <Panel style={{ gridColumn:"span 2" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <Tag color={C.textFaint}>Weekly habits</Tag>
        <div style={{ display:"flex", gap:4 }}>
          {D_SHORT.map((d,i) => <div key={i} style={{ width:22, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:i===today?C.accent:C.textFaint }}>{d}</div>)}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {habits.map((h,hi) => {
          const daysToToday = h.done.slice(0, today + 1);
          const rev = [...daysToToday].reverse();
          const streak = rev.findIndex(d => !d);
          const realStreak = streak === -1 ? daysToToday.length : streak;
          return (
            <div key={h.name} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:72, fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted, flexShrink:0 }}>{h.name}</div>
              <div style={{ flex:1, display:"flex", gap:4 }}>
                {h.done.map((done,di) => (
                  <div key={di} onClick={()=>toggle(hi,di)} style={{ flex:1, height:22, borderRadius:4, cursor:"pointer", background:done?C.accent:C.surfaceHi, border:`1px solid ${di===today?C.borderHi:C.border}`, boxShadow:done?`0 0 8px ${C.accent}44`:"none", transition:"all .15s" }} />
                ))}
              </div>
              <div style={{ width:28, textAlign:"right", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:realStreak>0?C.accent:C.textFaint }}>{realStreak>0?`${realStreak}🔥`:"—"}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
