"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { usePanelSettings } from "@/lib/settings";
import { useCalendarEvents, usePanelSize } from "@/lib/hooks";
import type { CalEvent, CalEventFull } from "@/lib/types";
import { CALENDAR_EVENTS, MONTHS_L, DAY_LABELS } from "@/lib/data";
import { Panel, Tag } from "@/components/ui";

function convertToCalEvents(remote: CalEventFull[], month: number, year: number): CalEvent[] {
  return remote
    .filter(ev => {
      const d = new Date(ev.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .map(ev => ({
      date: new Date(ev.date).getDate(),
      label: ev.label,
      color: ev.color,
      ...(ev.url ? { url: ev.url } : {}),
    }));
}

export function CalendarPanel({ time }: { time: Date }) {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const { panels } = usePanelSettings();
  const today=time.getDate(), thisMonth=time.getMonth(), thisYear=time.getFullYear();
  const [viewing, setViewing] = useState({ month:thisMonth, year:thisYear });
  const [events, setEvents] = useState<CalEvent[]>(CALENDAR_EVENTS);
  const [selected, setSelected] = useState<number|null>(null);

  const { events: remoteEvents, loaded } = useCalendarEvents(panels.calendarFeeds);
  const feedsKey = panels.calendarFeeds.join("|");

  // Sync remote events into local state when loaded
  useEffect(() => {
    if (!loaded) return;
    const base = panels.calendarFeeds.length > 0
      ? convertToCalEvents(remoteEvents, viewing.month, viewing.year)
      : CALENDAR_EVENTS;
    setEvents(base);
  }, [loaded, feedsKey, viewing.month, viewing.year]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCurMonth = viewing.month===thisMonth && viewing.year===thisYear;
  const firstDay=new Date(viewing.year,viewing.month,1).getDay();
  const daysInMonth=new Date(viewing.year,viewing.month+1,0).getDate();
  const cells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const evForDay=(d: number)=>events.filter(e=>e.date===d);
  const prev=()=>setViewing(v=>({month:v.month===0?11:v.month-1,year:v.month===0?v.year-1:v.year}));
  const next=()=>setViewing(v=>({month:v.month===11?0:v.month+1,year:v.month===11?v.year+1:v.year}));
  const dayName=(d: number)=>new Date(viewing.year,viewing.month,d).toLocaleDateString("en-US",{weekday:"short"});
  const upcoming=isCurMonth ? events.filter(e=>e.date>=today&&e.date<=today+6).sort((a,b)=>a.date-b.date).slice(0,3) : [];
  return (
    <Panel ref={ref} style={{ display:"flex", flexDirection:"column", padding:14 }}>
      <div className="hayati-drag-handle" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Tag color={C.textFaint}>Calendar</Tag>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, color:C.text }}>{MONTHS_L[viewing.month]} {viewing.year}</span>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={prev} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.textMuted, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"1px 6px", lineHeight:1.6 }}>&#8249;</button>
          {!isCurMonth && <button onClick={()=>setViewing({month:thisMonth,year:thisYear})} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.accent, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:"1px 6px", lineHeight:1.6 }}>today</button>}
          <button onClick={next} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.textMuted, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"1px 6px", lineHeight:1.6 }}>&#8250;</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
        {DAY_LABELS.map(d=><div key={d} style={{ textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.textFaint, padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((day,i) => {
          if (!day) return <div key={`e${i}`} />;
          const isToday=isCurMonth&&day===today, isSel=day===selected, dayEvs=evForDay(day);
          return (
            <div key={day} onClick={()=>setSelected(s=>s===day?null:day)}
              style={{ borderRadius:4, padding:"3px 2px", textAlign:"center", cursor:"pointer", background:isToday?C.accent:isSel?C.surfaceHi:"transparent", border:`1px solid ${isSel&&!isToday?C.borderHi:"transparent"}`, transition:"background .1s" }}
              onMouseEnter={e=>{ if(!isToday) e.currentTarget.style.background=C.surfaceHi; }}
              onMouseLeave={e=>{ if(!isToday&&!isSel) e.currentTarget.style.background="transparent"; else if(isSel&&!isToday) e.currentTarget.style.background=C.surfaceHi; }}
            >
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:isToday?700:400, color:isToday?C.bg:isSel?C.text:C.textMuted, display:"block", lineHeight:1 }}>{day}</span>
              {dayEvs.length>0 && <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:2 }}>{dayEvs.slice(0,3).map((ev,di)=><div key={di} style={{ width:2, height:2, borderRadius:"50%", background:isToday?C.bg+"cc":ev.color }} />)}</div>}
            </div>
          );
        })}
      </div>
      {(height === 0 || height >= 220) && <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
        {selected ? (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <Tag color={C.textFaint}>{MONTHS_L[viewing.month]} {selected}</Tag>
            <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, fontFamily:"'JetBrains Mono',monospace", fontSize:9 }}>✕</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:3, marginBottom:6 }}>
            {evForDay(selected).length===0 && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>no events</div>}
            {evForDay(selected).map((ev,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:3, height:3, borderRadius:"50%", background:ev.color, flexShrink:0 }} />
                {ev.url ? (
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted, flex:1, textDecoration:"none" }}>{ev.label}</a>
                ) : (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted, flex:1 }}>{ev.label}</span>
                )}
                <button onClick={()=>setEvents(ev2=>ev2.filter(e=>!(e.date===selected&&e.label===ev.label)))} style={{ background:"none", border:"none", cursor:"pointer", color:C.textFaint, fontSize:10 }}>&#215;</button>
              </div>
            ))}
          </div>
        </>) : upcoming.length > 0 ? (<>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.textFaint, letterSpacing:"0.5px", marginBottom:6, textTransform:"uppercase" }}>this week</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {upcoming.map((ev,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, width:26, flexShrink:0 }}>{ev.date===today?"today":dayName(ev.date).toLowerCase()}</span>
                <div style={{ width:3, height:3, borderRadius:"50%", background:ev.color, flexShrink:0 }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.label}</span>
              </div>
            ))}
          </div>
        </>) : (
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>no upcoming events</div>
        )}
      </div>}
    </Panel>
  );
}
