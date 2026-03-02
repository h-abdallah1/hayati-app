"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import type { ReadingItem } from "@/lib/types";
import { Panel, Tag } from "@/components/ui";

// ── Current book ─────────────────────────────────────────────────────────────

type CurrentBook = { title: string; author: string; progress: number; cover?: string };

const STORAGE_KEY = "hayati-current-book";
const DEFAULT_BOOK: CurrentBook = { title: "The Almanack of Naval Ravikant", author: "Eric Jorgenson", progress: 68 };

function readBook(): CurrentBook {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BOOK;
    return { ...DEFAULT_BOOK, ...JSON.parse(raw) };
  } catch { return DEFAULT_BOOK; }
}

async function fetchCover(title: string, author: string): Promise<string | undefined> {
  try {
    const q = encodeURIComponent(`intitle:${title}${author ? ` inauthor:${author}` : ""}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
    const data = await res.json();
    const thumb: string | undefined = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    if (!thumb) return undefined;
    return thumb.replace("http://", "https://").replace("zoom=1", "zoom=2");
  } catch { return undefined; }
}

// ── Reading list ──────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function ReadingPanel() {
  const C = useTheme();
  const tc = TYPE_COLOR(C);

  // Current book
  const [book,    setBook]    = useState<CurrentBook>(DEFAULT_BOOK);
  const [editing, setEditing] = useState(false);
  const [fetching,setFetching]= useState(false);
  const [draft,   setDraft]   = useState({ title: "", author: "" });

  useEffect(() => { setBook(readBook()); }, []);

  const saveBook = (updated: CurrentBook) => {
    setBook(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };
  const startEdit  = () => { setDraft({ title: book.title, author: book.author }); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const commitEdit = async () => {
    const title = draft.title.trim(), author = draft.author.trim();
    if (!title) return;
    setFetching(true); setEditing(false);
    const cover = await fetchCover(title, author);
    saveBook({ title, author, progress: 0, cover });
    setFetching(false);
  };

  const inputStyle = {
    background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 6,
    padding: "7px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
    color: C.text, outline: "none", width: "100%", boxSizing: "border-box" as const,
  };

  // Reading list
  const [items,  setItems]  = useState<ReadingItem[]>(INITIAL);
  const [adding, setAdding] = useState(false);
  const [title,  setTitle]  = useState("");
  const [url,    setUrl]    = useState("");
  const [type,   setType]   = useState<ReadingItem["type"]>("article");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) titleRef.current?.focus(); }, [adding]);

  const toggle    = (id: number) => setItems(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const closeForm = () => { setAdding(false); setTitle(""); setUrl(""); setType("article"); };
  const addItem   = () => {
    if (!title.trim()) return;
    setItems(i => [...i, { id: Date.now(), title: title.trim(), type, url: url.trim() || undefined, done: false }]);
    closeForm();
  };

  const unread = items.filter(i => !i.done);
  const read   = items.filter(i =>  i.done);

  return (
    <Panel style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" }}>

      {/* ── Currently reading ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <Tag color={C.textFaint}>Currently reading</Tag>
        {!editing
          ? <button onClick={startEdit} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.textFaint }}>✎</button>
          : <div style={{ display:"flex", gap:8 }}>
              <button onClick={cancelEdit} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>cancel</button>
              <button onClick={commitEdit} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.accent }}>save</button>
            </div>
        }
      </div>

      {editing ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <input autoFocus value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Book title..." style={inputStyle} />
          <input value={draft.author} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
            placeholder="Author..." style={inputStyle} />
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, marginTop:2 }}>
            Cover fetched automatically. Progress resets to 0.
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          <div style={{ width:56, height:78, borderRadius:6, flexShrink:0, background:C.surfaceHi, border:`1px solid ${C.border}`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {fetching
              ? <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>…</span>
              : book.cover
                ? <img src={book.cover} alt={book.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, color:C.border }}>▣</span>
            }
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", height:78 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:C.text, lineHeight:1.35, marginBottom:5 }}>{book.title}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint }}>{book.author}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ flex:1, height:3, background:C.border, borderRadius:2 }}>
                <div style={{ height:"100%", width:`${book.progress}%`, background:C.accent, borderRadius:2, boxShadow:`0 0 8px ${C.accent}55`, transition:"width .3s" }} />
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.accent, flexShrink:0 }}>{book.progress}%</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ height:1, background:C.border, margin:"18px 0 14px" }} />

      {/* ── Reading list ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.textFaint}>Reading list</Tag>
        <Tag color={C.textMuted}>{unread.length} to read</Tag>
      </div>

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:1 }}>
        {[...unread, ...read].map((item, i, arr) => (
          <div key={item.id}
            onClick={() => item.url ? window.open(item.url, "_blank", "noopener,noreferrer") : toggle(item.id)}
            style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = ".75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:item.done?C.textFaint:tc[item.type], width:16, flexShrink:0 }}>
              {TYPE_LABEL[item.type]}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:item.done?C.textFaint:item.url?C.accent:C.text, textDecoration:item.done?"line-through":item.url?"underline":"none", textDecorationColor:item.done?C.textFaint:C.accent+"66", flex:1, lineHeight:1.4 }}>
              {item.title}
            </span>
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
              onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") closeForm(); }}
              placeholder="title..."
              style={{ background:"transparent", border:"none", borderBottom:`1px solid ${C.border}`, outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, paddingBottom:4, width:"100%" }} />
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  background: type === t ? tc[t] + "22" : "none",
                  border: `1px solid ${type === t ? tc[t] : C.border}`,
                  borderRadius:4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color: type === t ? tc[t] : C.textFaint, padding:"3px 6px", flexShrink:0,
                }}>{TYPE_LABEL[t]}</button>
              ))}
              <input value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") closeForm(); }}
                placeholder="url (optional)"
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textMuted }} />
              <button onClick={addItem} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:5, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.accent, padding:"3px 10px", flexShrink:0 }}>add</button>
              <button onClick={closeForm} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint, padding:"3px 4px" }}>✕</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textFaint, padding:0, display:"flex", alignItems:"center", gap:6 }}
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
