"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Panel, Tag } from "@/components/ui";

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

export function ReadingPanel() {
  const C = useTheme();

  const [book,     setBook]     = useState<CurrentBook>(DEFAULT_BOOK);
  const [editing,  setEditing]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [draft,    setDraft]    = useState({ title: "", author: "" });

  useEffect(() => { setBook(readBook()); }, []);

  const saveBook   = (updated: CurrentBook) => {
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

  return (
    <Panel>
      <div className="hayati-drag-handle" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
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
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:C.text, lineHeight:1.35, marginBottom:5 }}>{book.title}</div>
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
    </Panel>
  );
}
