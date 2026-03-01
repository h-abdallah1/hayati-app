"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";
import type { Book } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

export function CurrentReadsPanel() {
  const C = useTheme();
  const [books, setBooks] = useState<Book[]>([
    { id:1, title:"The Almanack of Naval Ravikant", author:"Eric Jorgenson", progress:68, color:"#c8f135" },
    { id:2, title:"Clean Code", author:"Robert C. Martin", progress:34, color:"#4ecdc4" },
  ]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title:"", author:"" });
  const addBook = () => {
    if (!draft.title.trim()) return;
    const cols=[C.accent,C.teal,C.amber,C.blue];
    setBooks(b=>[...b,{id:Date.now(),title:draft.title.trim(),author:draft.author.trim(),progress:0,color:cols[b.length%cols.length]}]);
    setDraft({title:"",author:""}); setAdding(false);
  };
  const nudge = (id: number, delta: number) => setBooks(b=>b.map(x=>x.id===id?{...x,progress:Math.min(100,Math.max(0,x.progress+delta))}:x));
  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <Tag color={C.textFaint}>Currently reading</Tag>
        <button onClick={()=>setAdding(a=>!a)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:adding?C.accent:C.textFaint }}>{adding?"cancel":"+ add"}</button>
      </div>
      {adding && (
        <div style={{ display:"flex", gap:8, marginBottom:16, padding:"10px 12px", background:C.surfaceHi, borderRadius:8, border:`1px solid ${C.border}` }}>
          <input autoFocus value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} placeholder="title..." style={{ flex:2, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
          <div style={{ width:1, background:C.border }} />
          <input value={draft.author} onChange={e=>setDraft(d=>({...d,author:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addBook()} placeholder="author..." style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }} />
          <button onClick={addBook} style={{ background:"none", border:"none", cursor:"pointer", color:C.accent, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>add</button>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {books.map(book => (
          <div key={book.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{book.title}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>{book.author}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>nudge(book.id,-5)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.textFaint, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"1px 6px", lineHeight:1.6 }}>&#8722;</button>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:book.color, minWidth:30, textAlign:"center" }}>{book.progress}%</span>
                <button onClick={()=>nudge(book.id,5)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color:C.textFaint, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:"1px 6px", lineHeight:1.6 }}>+</button>
              </div>
            </div>
            <div style={{ height:3, background:C.border, borderRadius:2 }}>
              <div style={{ height:"100%", width:`${book.progress}%`, background:book.color, borderRadius:2, boxShadow:`0 0 8px ${book.color}55`, transition:"width .3s" }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
