"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { usePanelSettings } from "@/lib/settings";
import { Panel, Tag } from "@/components/ui";

export function FocusPanel() {
  const C = useTheme();
  const { panels } = usePanelSettings();
  const [focus, setFocus] = useState("Ship the Hayati dashboard");
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);

  const [phase, setPhase] = useState<"work" | "break">("work");
  const totalSecs = phase === "work" ? panels.pomodoroWork * 60 : panels.pomodoroBreak * 60;
  const [secs, setSecs] = useState(panels.pomodoroWork * 60);
  const [running, setRunning] = useState(false);

  // Reset timer when settings change (only if not running)
  useEffect(() => {
    if (!running) setSecs(phase === "work" ? panels.pomodoroWork * 60 : panels.pomodoroBreak * 60);
  }, [panels.pomodoroWork, panels.pomodoroBreak]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secs === 0 && !running) {
      const next = phase === "work" ? "break" : "work";
      setPhase(next);
      setSecs(next === "work" ? panels.pomodoroWork * 60 : panels.pomodoroBreak * 60);
    }
  }, [secs, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setRunning(false); setSecs(phase === "work" ? panels.pomodoroWork * 60 : panels.pomodoroBreak * 60); };
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const progress = Math.max(0, Math.min(100, ((totalSecs - secs) / totalSecs) * 100));

  return (
    <Panel style={{ borderColor:done?C.accent+"44":C.border, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <Tag color={done?C.accent:C.textFaint}>{"Today's focus"}</Tag>
        <button onClick={() => setDone(d=>!d)} style={{ width:20, height:20, borderRadius:"50%", border:`1.5px solid ${done?C.accent:C.borderHi}`, background:done?C.accent:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {done && <span style={{ fontSize:10, color:C.bg, fontWeight:700 }}>&#10003;</span>}
        </button>
      </div>
      {editing
        ? <input autoFocus value={focus} onChange={e=>setFocus(e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>e.key==="Enter"&&setEditing(false)} style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.text }} />
        : <div onClick={()=>setEditing(true)} style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:done?C.textFaint:C.text, textDecoration:done?"line-through":"none", textDecorationColor:C.textFaint, cursor:"text", lineHeight:1.3 }}>{focus}</div>
      }
      <div style={{ marginTop:"auto", paddingTop:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ flex:1, height:1, background:C.border }} />
          <Tag color={C.textFaint}>{phase}</Tag>
        </div>
        {/* Progress bar + timer inline */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ flex:1, height:3, background:C.border, borderRadius:2 }}>
            <div style={{ height:"100%", width:`${progress}%`, background:running?C.accent:C.borderHi, borderRadius:2, transition:"width 1s linear", boxShadow:running?`0 0 8px ${C.accent}55`:undefined }} />
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, color:running?C.accent:C.text, flexShrink:0, minWidth:44, textAlign:"right" }}>
            {mm}:{ss}
          </span>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <button onClick={() => setRunning(r=>!r)} style={{ border:`1px solid ${C.border}`, borderRadius:5, background:"transparent", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, padding:"3px 10px" }}>
            {running ? "⏸ pause" : "▶ start"}
          </button>
          <button onClick={reset} style={{ border:`1px solid ${C.border}`, borderRadius:5, background:"transparent", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.textMuted, padding:"3px 10px" }}>
            ↺
          </button>
        </div>
      </div>
    </Panel>
  );
}
