"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import type { Task } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

export function TasksPanel() {
  const C = useTheme();
  const [tasks, setTasks] = useState<Task[]>([
    { id:1, text:"Review pull requests",   done:false, p:"high" },
    { id:2, text:"Fix auth bug on mobile",  done:false, p:"high" },
    { id:3, text:"Update README",           done:true,  p:"low"  },
    { id:4, text:"Design system audit",     done:false, p:"med"  },
    { id:5, text:"Read 20 pages",           done:false, p:"low"  },
  ]);
  const [input, setInput] = useState("");
  const pc: Record<string, string> = { high:C.red, med:C.amber, low:C.textFaint };
  const doneN = tasks.filter(t=>t.done).length;
  const add = () => { if(!input.trim()) return; setTasks(ts=>[...ts,{id:Date.now(),text:input.trim(),done:false,p:"med"}]); setInput(""); };
  return (
    <Panel style={{ display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Tasks</Tag>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textMuted }}>{doneN}/{tasks.length}</span>
      </div>
      <div style={{ height:2, background:C.border, borderRadius:1, marginBottom:14 }}>
        <div style={{ height:"100%", width:`${tasks.length?(doneN/tasks.length)*100:0}%`, background:C.accent, borderRadius:1, transition:"width .3s" }} />
      </div>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
        {[...tasks.filter(t=>!t.done),...tasks.filter(t=>t.done)].map(task => (
          <div key={task.id} onClick={()=>setTasks(ts=>ts.map(x=>x.id===task.id?{...x,done:!x.done}:x))}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 8px", borderRadius:6, cursor:"pointer" }}
            onMouseEnter={e=>(e.currentTarget.style.background=C.surfaceHi)}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
          >
            <div style={{ width:14, height:14, borderRadius:3, flexShrink:0, border:task.done?"none":`1px solid ${pc[task.p]}`, background:task.done?C.textFaint:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {task.done && <span style={{ fontSize:8, color:C.bg, fontWeight:900 }}>&#10003;</span>}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:task.done?C.textFaint:C.text, textDecoration:task.done?"line-through":"none", textDecorationColor:C.textFaint, flex:1, lineHeight:1.4 }}>{task.text}</span>
            {!task.done && <div style={{ width:4, height:4, borderRadius:"50%", background:pc[task.p], flexShrink:0 }} />}
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.textFaint }}>+</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="add task..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
      </div>
    </Panel>
  );
}
