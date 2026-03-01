"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import type { ReadingItem } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

const TYPE_COLOR = (C: Record<string, string>) => ({ book: C.teal, essay: C.amber, article: C.blue });
const TYPE_LABEL: Record<string, string> = { book: "BK", essay: "ES", article: "AR" };
const TYPES = ["book", "essay", "article"] as const;

const INITIAL: ReadingItem[] = [
  { id:1, title:"The Pragmatic Programmer",              type:"book",    done:false },
  { id:2, title:"You and Your Research — Hamming",       type:"essay",   done:false, url:"https://www.cs.virginia.edu/~robins/YouAndYourResearch.html" },
  { id:3, title:"Designing Data-Intensive Applications", type:"book",    done:false },
  { id:4, title:"Paul Graham — Taste for Makers",        type:"essay",   done:true,  url:"http://www.paulgraham.com/taste.html" },
  { id:5, title:"Shape Up by Basecamp",                  type:"article", done:true,  url:"https://basecamp.com/shapeup" },
];

export function ReadingListPanel() {
  const C = useTheme();
  const tc = TYPE_COLOR(C);
  const [items, setItems] = useState<ReadingItem[]>(INITIAL);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ReadingItem["type"]>("article");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) titleRef.current?.focus(); }, [adding]);

  const toggle = (id: number) =>
    setItems(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));

  const openForm = () => { setAdding(true); };

  const closeForm = () => { setAdding(false); setTitle(""); setUrl(""); setType("article"); };

  const add = () => {
    if (!title.trim()) return;
    setItems(i => [...i, { id: Date.now(), title: title.trim(), type, url: url.trim() || undefined, done: false }]);
    closeForm();
  };

  const unread = items.filter(i => !i.done);
  const read   = items.filter(i =>  i.done);

  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Reading list</Tag>
        <Tag color={C.textMuted}>{unread.length} to read</Tag>
      </div>

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:1 }}>
        {[...unread, ...read].map((item, i, arr) => (
          <div key={item.id}
            onClick={() => item.url ? window.open(item.url, "_blank", "noopener,noreferrer") : toggle(item.id)}
            style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", cursor: item.url ? "pointer" : "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = ".75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {/* Type badge */}
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:item.done?C.textFaint:tc[item.type], width:16, flexShrink:0 }}>
              {TYPE_LABEL[item.type]}
            </span>

            {/* Title */}
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:item.done?C.textFaint:item.url?C.accent:C.text, textDecoration:item.done?"line-through":item.url?"underline":"none", textDecorationColor:item.done?C.textFaint:C.accent+"66", flex:1, lineHeight:1.4 }}>
              {item.title}
            </span>

            {/* Checkbox — always toggles done, doesn't open URL */}
            <div
              onClick={e => { e.stopPropagation(); toggle(item.id); }}
              style={{ width:12, height:12, borderRadius:3, border:`1px solid ${item.done?C.textFaint:C.borderHi}`, background:item.done?C.textFaint:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
            >
              {item.done && <span style={{ fontSize:7, color:C.bg, fontWeight:900 }}>&#10003;</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:10 }}>
        {adding ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") add(); if (e.key === "Escape") closeForm(); }}
              placeholder="title..."
              style={{ background:"transparent", border:"none", borderBottom:`1px solid ${C.border}`, outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, paddingBottom:4, width:"100%" }} />
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  background: type === t ? tc[t] + "22" : "none",
                  border: `1px solid ${type === t ? tc[t] : C.border}`,
                  borderRadius:4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color: type === t ? tc[t] : C.textFaint, padding:"3px 6px", flexShrink:0,
                }}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
              <input value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") add(); if (e.key === "Escape") closeForm(); }}
                placeholder="url (optional)"
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted }} />
              <button onClick={add} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.accent, padding:"3px 10px", flexShrink:0 }}>add</button>
              <button onClick={closeForm} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint, padding:"3px 4px" }}>✕</button>
            </div>
          </div>
        ) : (
          <button onClick={openForm} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint, padding:0, display:"flex", alignItems:"center", gap:6 }}
            onMouseEnter={e => (e.currentTarget.style.color = C.textMuted)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textFaint)}
          >
            <span style={{ fontSize:13 }}>+</span> add item
          </button>
        )}
      </div>
    </Panel>
  );
}
