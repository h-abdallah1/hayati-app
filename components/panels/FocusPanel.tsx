"use client";

import { useState } from "react";
import { C } from "@/lib/design";
import { Panel, Tag } from "@/components/ui";

export function FocusPanel() {
  const [focus, setFocus] = useState("Ship the Hayati dashboard");
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);
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
      <div style={{ marginTop:"auto", paddingTop:14, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, height:1, background:C.border }} />
        <Tag color={C.textFaint}>click to edit</Tag>
      </div>
    </Panel>
  );
}
