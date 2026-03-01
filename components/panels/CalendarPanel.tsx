"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import type { CalEvent } from "@/lib/types";
import { CALENDAR_EVENTS, MONTHS_L, DAY_LABELS } from "@/lib/data";
import { Panel, Tag } from "@/components/ui";

export function CalendarPanel({ time }: { time: Date }) {
  const C = useTheme();
  const today=time.getDate(), thisMonth=time.getMonth(), thisYear=time.getFullYear();
  const [viewing, setViewing] = useState({ month:thisMonth, year:thisYear });
  const [events, setEvents] = useState<CalEvent[]>(CALENDAR_EVENTS);
  const [selected, setSelected] = useState<number|null>(null);
  const [draft, setDraft] = useState("");
  const isCurMonth = viewing.month===thisMonth && viewing.year===thisYear;
  const firstDay=new Date(viewing.year,viewing.month,1).getDay();
  const daysInMonth=new Date(viewing.year,viewing.month+1,0).getDate();
  const cells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const evForDay=(d: number)=>events.filter(e=>e.date===d);
  const addEvent=()=>{ if(!draft.trim()||!selected) return; const cols=[C.accent,C.teal,C.amber,C.blue,C.red]; setEvents(ev=>[...ev,{date:selected,label:draft.trim(),color:cols[ev.length%cols.length]}]); setDraft(""); };
  const prev=()=>setViewing(v=>({month:v.month===0?11:v.month-1,year:v.month===0?v.year-1:v.year}));
  const next=()=>setViewing(v=>({month:v.month===11?0:v.month+1,year:v.month===11?v.year+1:v.year}));
  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Tag color={C.textFaint}>Calendar</Tag>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:C.text }}>{MONTHS_L[viewing.month]} {viewing.year}</span>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={prev} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, color:C.textMuted, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:"2px 8px", lineHeight:1.6 }}>&#8249;</button>
          {!isCurMonth && <button onClick={()=>setViewing({month:thisMonth,year:thisYear})} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, color:C.accent, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:"2px 8px", lineHeight:1.6 }}>today</button>}
          <button onClick={next} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, color:C.textMuted, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:"2px 8px", lineHeight:1.6 }}>&#8250;</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
        {DAY_LABELS.map(d=><div key={d} style={{ textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {cells.map((day,i) => {
          if (!day) return <div key={`e${i}`} />;
          const isToday=isCurMonth&&day===today, isSel=day===selected, dayEvs=evForDay(day);
          return (
            <div key={day} onClick={()=>setSelected(s=>s===day?null:day)}
              style={{ borderRadius:6, padding:"5px 3px 4px", textAlign:"center", cursor:"pointer", background:isToday?C.accent:isSel?C.surfaceHi:"transparent", border:`1px solid ${isSel&&!isToday?C.borderHi:"transparent"}`, transition:"background .1s" }}
              onMouseEnter={e=>{ if(!isToday) e.currentTarget.style.background=C.surfaceHi; }}
              onMouseLeave={e=>{ if(!isToday&&!isSel) e.currentTarget.style.background="transparent"; else if(isSel&&!isToday) e.currentTarget.style.background=C.surfaceHi; }}
            >
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:isToday?700:400, color:isToday?C.bg:isSel?C.text:C.textMuted, display:"block", lineHeight:1 }}>{day}</span>
              {dayEvs.length>0 && <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:3 }}>{dayEvs.slice(0,3).map((ev,di)=><div key={di} style={{ width:3, height:3, borderRadius:"50%", background:isToday?C.bg+"cc":ev.color }} />)}</div>}
            </div>
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <Tag color={C.textFaint}>{MONTHS_L[viewing.month]} {selected}</Tag>
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
            {evForDay(selected).length===0 && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>no events</div>}
            {evForDay(selected).map((ev,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:ev.color }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textMuted, flex:1 }}>{ev.label}</span>
                <button onClick={()=>setEvents(ev2=>ev2.filter(e=>!(e.date===selected&&e.label===ev.label)))} style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, fontSize:11 }}>&#215;</button>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textFaint }}>+</span>
            <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEvent()} placeholder="add event..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
            <button onClick={addEvent} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>add</button>
          </div>
        </div>
      )}
    </Panel>
  );
}
