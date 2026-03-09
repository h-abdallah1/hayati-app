"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { load, persist } from "@/lib/books";
import { toDateKey } from "@/app/overview/helpers";
import type { ReadingEntry } from "@/lib/types";

type ViewMode = "grid" | "timeline";

async function fetchCover(title: string, author?: string): Promise<string | null> {
  try {
    const q = `title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ""}&limit=1&fields=cover_i`;
    const res = await fetch(`https://openlibrary.org/search.json?${q}`);
    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
  } catch {
    return null;
  }
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

const EMPTY_FORM = { title: "", author: "", date: "", url: "" };

export default function ReadingPage() {
  const C = useTheme();
  const [books, setBooks] = useState<ReadingEntry[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, date: toDateKey(new Date()) });

  useEffect(() => { setBooks(load()); }, []);

  const save = () => {
    if (!form.title.trim()) return;
    const entry: ReadingEntry = {
      title: form.title.trim(),
      finishedDate: form.date || toDateKey(new Date()),
      ...(form.author.trim() ? { author: form.author.trim() } : {}),
      ...(form.url.trim() ? { url: form.url.trim() } : {}),
    };
    const next = [...books, entry];
    setBooks(next);
    persist(next);
    setForm({ ...EMPTY_FORM, date: toDateKey(new Date()) });
    setAdding(false);
    fetchCover(entry.title, entry.author).then(cover => {
      if (!cover) return;
      setBooks(prev => {
        const patched = prev.map(b =>
          b.title === entry.title && b.finishedDate === entry.finishedDate
            ? { ...b, cover }
            : b
        );
        persist(patched);
        return patched;
      });
    });
  };

  const del = (b: ReadingEntry) => {
    const next = books.filter(x => !(x.title === b.title && x.finishedDate === b.finishedDate));
    setBooks(next);
    persist(next);
  };

  const cancel = () => { setAdding(false); setForm({ ...EMPTY_FORM, date: toDateKey(new Date()) }); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  const now = new Date();
  const thisYear = String(now.getFullYear());
  const thisMonth = `${thisYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const countYear = books.filter(b => b.finishedDate.startsWith(thisYear)).length;
  const countMonth = books.filter(b => b.finishedDate.startsWith(thisMonth)).length;

  const filtered = books.filter(b =>
    !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => b.finishedDate.localeCompare(a.finishedDate));

  const byMonth = sorted.reduce<Record<string, ReadingEntry[]>>((acc, b) => {
    const key = b.finishedDate.slice(0, 7);
    (acc[key] ??= []).push(b);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  const btnBase: React.CSSProperties = {
    background: "none",
    border: `1px solid ${C.border}`,
    borderRadius: 5,
    cursor: "pointer",
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 10,
    padding: "3px 9px",
    lineHeight: 1.6,
  };
  const activeBtn = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? C.accentDim : "none",
    color: active ? C.accent : C.textMuted,
  });
  const inputSt: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 5,
    padding: "5px 9px",
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11,
    color: C.text,
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingLeft: 72, paddingRight: 32, paddingTop: 32, paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em" }}>
          READING
        </span>
        <button onClick={() => setAdding(true)} style={{ ...btnBase, marginLeft: "auto", color: C.accent, borderColor: C.accentMid }}>
          + log book
        </button>
      </div>

      {/* Stats */}
      {books.length > 0 && (
        <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {[
            { val: books.length, label: "total" },
            { val: countYear,    label: "this year" },
            { val: countMonth,   label: "this month" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text }}>{s.val}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ marginBottom: 24, padding: "14px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginBottom: 2 }}>LOG BOOK</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="title (required)" onKeyDown={onKey} style={{ ...inputSt, flex: "2 1 180px" }} />
            <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="author" onKeyDown={onKey} style={{ ...inputSt, flex: "1 1 140px" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} onKeyDown={onKey} style={{ ...inputSt, flex: "1 1 140px" }} />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="url (optional)" onKeyDown={onKey} style={{ ...inputSt, flex: "2 1 180px" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} style={{ ...btnBase, color: C.accent, borderColor: C.accentMid }}>save</button>
            <button onClick={cancel} style={{ ...btnBase, color: C.textFaint }}>cancel</button>
          </div>
        </div>
      )}

      {/* Controls */}
      {books.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          {(["grid", "timeline"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={activeBtn(view === v)}>{v}</button>
          ))}
          <div style={{ flex: 1 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search…"
            style={{ ...inputSt, fontSize: 10, padding: "3px 9px", background: C.surfaceHi, maxWidth: 200, lineHeight: 1.6 }}
          />
        </div>
      )}

      {/* Content */}
      {books.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          no books logged yet — click <span style={{ color: C.accent }}>+ log book</span> to add one
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          no results
        </div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 16 }}>
          {sorted.map((b, i) => <BookCard key={i} book={b} C={C} onDelete={del} />)}
        </div>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <div style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 24 }}>
            {months.map(month => (
              <div key={month}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingTop: 4 }}>
                  <div style={{ position: "absolute", left: -29, width: 8, height: 8, borderRadius: 2, background: C.border, transform: "rotate(45deg)" }} />
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text }}>{monthLabel(month)}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
                    {byMonth[month].length} book{byMonth[month].length !== 1 ? "s" : ""}
                  </span>
                </div>
                {byMonth[month].map((b, i) => (
                  <div key={i} style={{ position: "relative", paddingBottom: 20 }}>
                    <div style={{ position: "absolute", left: -29, top: 10, width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
                    <BookRow book={b} C={C} onDelete={del} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Palette = ReturnType<typeof useTheme>;

function BookCard({ book: b, C, onDelete }: { book: ReadingEntry; C: Palette; onDelete: (b: ReadingEntry) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Cover */}
      <div style={{
        width: "100%", aspectRatio: "2/3", borderRadius: 6,
        overflow: "hidden", background: C.surfaceHi,
        border: `1px solid ${C.border}`, position: "relative",
      }}>
        {b.cover ? (
          <img src={b.cover} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, textAlign: "center", lineHeight: 1.4 }}>{b.title}</span>
          </div>
        )}
        {/* Delete button overlay */}
        <button
          onClick={() => onDelete(b)}
          title="delete"
          style={{
            position: "absolute", top: 4, right: 4,
            background: "rgba(0,0,0,0.55)", border: "none",
            borderRadius: 3, cursor: "pointer",
            fontSize: 11, color: "#fff",
            width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
        >
          ×
        </button>
      </div>
      {/* Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, lineHeight: 1.4, wordBreak: "break-word" }}>
          {b.url ? (
            <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = C.text)}>
              {b.title}
            </a>
          ) : b.title}
        </span>
        {b.author && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{b.author}</span>}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{b.finishedDate}</span>
      </div>
    </div>
  );
}

function BookRow({ book: b, C, onDelete }: { book: ReadingEntry; C: Palette; onDelete: (b: ReadingEntry) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 36, flexShrink: 0, aspectRatio: "2/3", borderRadius: 3, overflow: "hidden", background: C.surfaceHi, border: `1px solid ${C.border}` }}>
        {b.cover && <img src={b.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      </div>
      <button onClick={() => onDelete(b)} title="delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textFaint, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text, flex: 1, minWidth: 0 }}>
        {b.url ? (
          <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = C.text)}>
            {b.title}
          </a>
        ) : b.title}
        {b.author && <span style={{ color: C.textFaint }}> · {b.author}</span>}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>{fmtDate(b.finishedDate)}</span>
    </div>
  );
}
