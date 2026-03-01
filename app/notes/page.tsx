"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import type { Note } from "@/lib/types";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const INITIAL: Note[] = [{
  id: 1,
  title: "Welcome",
  content: "This is your personal notes space.\n\nClick a note on the left to edit it, or create a new one with the + button.",
  updated: new Date().toISOString(),
}];

function load(): Note[] {
  try { const s = localStorage.getItem("hayati-notes"); if (s) return JSON.parse(s); } catch {}
  return INITIAL;
}
function persist(notes: Note[]) {
  try { localStorage.setItem("hayati-notes", JSON.stringify(notes)); } catch {}
}

export default function NotesPage() {
  const C = useTheme();
  const [notes,      setNotes]      = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const n = load();
    setNotes(n);
    if (n.length > 0) setSelectedId(n[0].id);
  }, []);

  const selected = notes.find(n => n.id === selectedId);

  const update = (next: Note[]) => {
    setNotes(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(next), 300);
  };

  const newNote = () => {
    const n: Note = { id: Date.now(), title: "Untitled", content: "", updated: new Date().toISOString() };
    const next = [n, ...notes];
    update(next);
    setSelectedId(n.id);
  };

  const editNote = (field: "title" | "content", value: string) =>
    update(notes.map(n => n.id === selectedId ? { ...n, [field]: value, updated: new Date().toISOString() } : n));

  const deleteNote = (id: number) => {
    const next = notes.filter(n => n.id !== id);
    update(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const bareInput: React.CSSProperties = {
    background: "transparent", border: "none", outline: "none",
    fontFamily: "'JetBrains Mono',monospace", color: C.text,
    resize: "none", width: "100%",
  };

  return (
    <div style={{ height: "100vh", background: C.bg, display: "flex", overflow: "hidden" }}>

      {/* Left: note list */}
      <div style={{ width: 220, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: C.text }}>Notes</span>
            <span style={{ fontFamily: "'Scheherazade New',serif", fontSize: 14, color: C.textFaint, marginLeft: 8 }}>ملاحظات</span>
          </div>
          <button
            onClick={newNote}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: C.textFaint, padding: 0, lineHeight: 1 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.textFaint; }}
          >
            +
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {notes.length === 0 && (
            <div style={{ padding: "20px 16px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
              no notes yet
            </div>
          )}
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              style={{
                padding: "10px 16px", cursor: "pointer",
                background: selectedId === n.id ? C.surfaceHi : "transparent",
                borderBottom: `1px solid ${C.border}22`,
              }}
              onMouseEnter={e => { if (selectedId !== n.id) (e.currentTarget as HTMLDivElement).style.background = C.surface; }}
              onMouseLeave={e => { if (selectedId !== n.id) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: selectedId === n.id ? C.text : C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {n.title || "Untitled"}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, marginTop: 3 }}>
                {relTime(n.updated)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: editor */}
      {selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Note title bar */}
          <div style={{ padding: "20px 28px 0", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-end", gap: 12 }}>
            <input
              value={selected.title}
              onChange={e => editNote("title", e.target.value)}
              style={{ ...bareInput, fontSize: 18, fontWeight: 700, paddingBottom: 14, flex: 1 }}
            />
            <button
              onClick={() => deleteNote(selected.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, padding: "0 0 16px", flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.red; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.textFaint; }}
            >
              delete
            </button>
          </div>

          {/* Content */}
          <textarea
            value={selected.content}
            onChange={e => editNote("content", e.target.value)}
            style={{ ...bareInput, flex: 1, padding: "20px 28px", fontSize: 12, lineHeight: 1.9, overflowY: "auto" }}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>
            select or create a note
          </span>
        </div>
      )}
    </div>
  );
}
