"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import type { ReadingItem } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

export function ReadingListPanel() {
  const C = useTheme();
  const [items, setItems] = useState<ReadingItem[]>([
    { id:1, title:"The Pragmatic Programmer",              type:"book",    done:false },
    { id:2, title:"You and Your Research — Hamming",       type:"essay",   done:false },
    { id:3, title:"Designing Data-Intensive Applications", type:"book",    done:false },
    { id:4, title:"Paul Graham — Taste for Makers",        type:"essay",   done:true  },
    { id:5, title:"Shape Up by Basecamp",                  type:"article", done:true  },
  ]);
  const [input, setInput] = useState("");
  const tc: Record<string, string> = {book:C.teal,essay:C.amber,article:C.blue};
  const tl: Record<string, string> = {book:"BK",essay:"ES",article:"AR"};
  const add = () => { if(!input.trim()) return; setItems(i=>[...i,{id:Date.now(),title:input.trim(),type:"article",done:false}]); setInput(""); };
  const unread=items.filter(i=>!i.done), read=items.filter(i=>i.done);
  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Reading list</Tag>
        <Tag color={C.textMuted}>{unread.length} to read</Tag>
      </div>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:1 }}>
        {[...unread,...read].map((item,i,arr) => (
          <div key={item.id} onClick={()=>setItems(prev=>prev.map(x=>x.id===item.id?{...x,done:!x.done}:x))}
            style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}
            onMouseEnter={e=>(e.currentTarget.style.opacity=".75")}
            onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
          >
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:item.done?C.textFaint:tc[item.type], width:16, flexShrink:0 }}>{tl[item.type]}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:item.done?C.textFaint:C.text, textDecoration:item.done?"line-through":"none", textDecorationColor:C.textFaint, flex:1, lineHeight:1.4 }}>{item.title}</span>
            <div style={{ width:12, height:12, borderRadius:3, border:`1px solid ${item.done?C.textFaint:C.borderHi}`, background:item.done?C.textFaint:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.done && <span style={{ fontSize:7, color:C.bg, fontWeight:900 }}>&#10003;</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.textFaint }}>+</span>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="add to list..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
      </div>
    </Panel>
  );
}
