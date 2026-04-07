"use client";

import { useState, useEffect } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { loadBooks, persistBooks } from "@/lib/bookList";
import { toDateKey } from "@/app/overview/helpers";
import type { BookEntry } from "@/lib/types";

async function fetchBookCover(title: string, author: string): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ title, limit: "1", ...(author ? { author } : {}) });
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    const data = await res.json() as { docs?: { cover_i?: number }[] };
    const coverId = data.docs?.[0]?.cover_i;
    if (!coverId) return undefined;
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } catch { return undefined; }
}

type ViewMode = "grid" | "timeline";
type Palette = ReturnType<typeof useTheme>;

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
  const { isDark } = useThemeToggle();

  const [bookList,     setBookList]     = useState<BookEntry[]>([]);
  const [fetchingBook, setFetchingBook] = useState<string | null>(null);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editDraft,    setEditDraft]    = useState({ title: "", author: "" });
  const [view,           setView]           = useState<ViewMode>("grid");
  const [search,         setSearch]         = useState("");
  const [adding,         setAdding]         = useState(false);
  const [fetchingCovers, setFetchingCovers] = useState(false);
  const [coverProgress,  setCoverProgress]  = useState("");
  const [form,           setForm]           = useState({ ...EMPTY_FORM, date: toDateKey(new Date()) });

  useEffect(() => {
    setBookList(loadBooks());
  }, []);

  const deleteBook = (id: string) => {
    const next = bookList.filter(b => b.id !== id);
    setBookList(next);
    persistBooks(next);
  };

  const startEdit  = (b: BookEntry) => { setEditingId(b.id); setEditDraft({ title: b.title, author: b.author }); };
  const commitEdit = async (id: string) => {
    const title  = editDraft.title.trim();
    const author = editDraft.author.trim();
    if (!title) return;
    setEditingId(null);
    setFetchingBook(id);
    const cover = await fetchBookCover(title, author);
    const next  = bookList.map(b => b.id === id ? { ...b, title, author, cover: cover ?? b.cover } : b);
    setBookList(next);
    persistBooks(next);
    setFetchingBook(null);
  };
  const cancelEdit = () => setEditingId(null);

  const saveLog = () => {
    if (!form.title.trim()) return;
    const title  = form.title.trim();
    const author = form.author.trim();
    const date   = form.date || toDateKey(new Date());
    const url    = form.url.trim() || undefined;

    const id    = crypto.randomUUID();
    const entry: BookEntry = {
      id, title, author,
      addedAt: new Date(date).toISOString(),
      finishedDate: date,
      url,
    };
    const next = [...bookList, entry];
    setBookList(next);
    persistBooks(next);
    setFetchingBook(id);
    fetchBookCover(title, author).then(cover => {
      if (!cover) { setFetchingBook(null); return; }
      setBookList(prev => {
        const patched = prev.map(b => b.id === id ? { ...b, cover } : b);
        persistBooks(patched);
        return patched;
      });
      setFetchingBook(null);
    });

    setForm({ ...EMPTY_FORM, date: toDateKey(new Date()) });
    setAdding(false);
  };

  const cancel = () => { setAdding(false); setForm({ ...EMPTY_FORM, date: toDateKey(new Date()) }); };

  const fetchAllCovers = async () => {
    const missing = bookList.filter(b => !b.cover);
    if (!missing.length) return;
    setFetchingCovers(true);
    let updated = [...bookList];
    for (let i = 0; i < missing.length; i++) {
      const b = missing[i];
      setCoverProgress(`${i + 1} / ${missing.length}`);
      const cover = await fetchBookCover(b.title, b.author);
      if (cover) {
        updated = updated.map(x => x.id === b.id ? { ...x, cover } : x);
        setBookList([...updated]);
      }
      await new Promise(r => setTimeout(r, 300));
    }
    persistBooks(updated);
    setFetchingCovers(false);
    setCoverProgress("");
  };

  const exportCSV = () => {
    const rows = [
      ["title", "author", "finishedDate", "url"],
      ...bookList.map(b => [b.title, b.author, b.finishedDate ?? "", b.url ?? ""]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "books.csv";
    a.click();
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") saveLog(); if (e.key === "Escape") cancel(); };

  const DEFAULT_DATE = "2025-12-31";
  const now        = new Date();
  const thisYear   = String(now.getFullYear());
  const thisMonth  = `${thisYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const countYear  = bookList.filter(b => (b.finishedDate ?? DEFAULT_DATE).startsWith(thisYear)).length;
  const countMonth = bookList.filter(b => (b.finishedDate ?? DEFAULT_DATE).startsWith(thisMonth)).length;

  const filtered = bookList
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const da = a.finishedDate ?? DEFAULT_DATE;
      const db = b.finishedDate ?? DEFAULT_DATE;
      if (da !== db) return db.localeCompare(da);
      return b.addedAt.localeCompare(a.addedAt);
    });

  const byMonth = filtered.reduce<Record<string, BookEntry[]>>((acc, b) => {
    const key = (b.finishedDate ?? DEFAULT_DATE).slice(0, 7);
    (acc[key] ??= []).push(b);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  const btnBase: React.CSSProperties = {
    background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
    cursor: "pointer", fontFamily: "'JetBrains Mono',monospace",
    fontSize: 10, padding: "3px 9px", lineHeight: 1.6,
  };
  const activeBtn = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? C.accentDim : "none",
    color: active ? C.accent : C.textMuted,
  });
  const inputSt: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5,
    padding: "5px 9px", fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11, color: C.text, outline: "none",
  };

  const editingProps = { editingId, editDraft, setEditDraft, onStartEdit: startEdit, onCommitEdit: commitEdit, onCancelEdit: cancelEdit, fetchingBook };

  return (
    <div style={{
      minHeight: "100vh", color: C.text,
      paddingLeft: 72, paddingRight: 32, paddingTop: 32, paddingBottom: 64,
      background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
      backdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
      WebkitBackdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em" }}>READING</span>
        <button onClick={fetchAllCovers} disabled={fetchingCovers} style={{ ...btnBase, marginLeft: "auto", color: C.textMuted, borderColor: C.border }}>
          {fetchingCovers ? `fetching covers ${coverProgress}` : "fetch covers"}
        </button>
        <button onClick={exportCSV} style={{ ...btnBase, color: C.textMuted, borderColor: C.border }}>export csv</button>
        <button onClick={() => setAdding(true)} style={{ ...btnBase, color: C.accent, borderColor: C.accentMid }}>+ log book</button>
      </div>

      {/* Log book form */}
      {adding && (
        <div style={{ marginBottom: 24, padding: "14px 16px", background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)", border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
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
            <button onClick={saveLog} style={{ ...btnBase, color: C.accent, borderColor: C.accentMid }}>save</button>
            <button onClick={cancel} style={{ ...btnBase, color: C.textFaint }}>cancel</button>
          </div>
        </div>
      )}

      {/* Controls */}
      {bookList.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          {(["grid", "timeline"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={activeBtn(view === v)}>{v}</button>
          ))}
          <div style={{ flex: 1 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search…"
            style={{ ...inputSt, fontSize: 10, padding: "3px 9px", background: C.surfaceHi, maxWidth: 200, lineHeight: 1.6 }}
          />
        </div>
      )}

      {/* Stats */}
      {bookList.length > 0 && (
        <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "10px 14px", background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)", borderRadius: 8, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {[
            { val: bookList.length, label: "total" },
            { val: countYear,       label: "this year" },
            { val: countMonth,      label: "this month" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text }}>{s.val}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {bookList.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          no books yet — click <span style={{ color: C.accent }}>+ log book</span> to add one
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>no results</div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 16 }}>
          {filtered.map(b => <BookCard key={b.id} book={b} C={C} onDelete={deleteBook} {...editingProps} />)}
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
                {byMonth[month].map(b => (
                  <div key={b.id} style={{ position: "relative", paddingBottom: 20 }}>
                    <div style={{ position: "absolute", left: -29, top: 10, width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
                    <BookRow book={b} C={C} onDelete={deleteBook} {...editingProps} />
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

interface EditingProps {
  editingId: string | null;
  editDraft: { title: string; author: string };
  setEditDraft: React.Dispatch<React.SetStateAction<{ title: string; author: string }>>;
  onStartEdit: (b: BookEntry) => void;
  onCommitEdit: (id: string) => void;
  onCancelEdit: () => void;
  fetchingBook: string | null;
}

function BookCard({ book: b, C, onDelete, editingId, editDraft, setEditDraft, onStartEdit, onCommitEdit, onCancelEdit, fetchingBook }: { book: BookEntry; C: Palette; onDelete: (id: string) => void } & EditingProps) {
  const isEditing = editingId === b.id;
  const inputSt: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
    padding: "4px 7px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
    color: C.text, outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: 6, overflow: "hidden", background: C.surfaceHi, border: `1px solid ${C.border}`, position: "relative" }}>
        {fetchingBook === b.id
          ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>…</span>
            </div>
          : b.cover
            ? <img src={b.cover} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, textAlign: "center", lineHeight: 1.4 }}>{b.title}</span>
              </div>
        }
        <button onClick={() => onDelete(b.id)} title="delete" style={{
          position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", border: "none",
          borderRadius: 3, cursor: "pointer", fontSize: 11, color: "#fff", width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
        >×</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {isEditing ? (
          <>
            <input autoFocus value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") onCommitEdit(b.id); if (e.key === "Escape") onCancelEdit(); }} style={inputSt} />
            <input value={editDraft.author} onChange={e => setEditDraft(d => ({ ...d, author: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") onCommitEdit(b.id); if (e.key === "Escape") onCancelEdit(); }}
              placeholder="author" style={{ ...inputSt, marginTop: 2 }} />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button onClick={() => onCommitEdit(b.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.accent }}>save</button>
              <button onClick={onCancelEdit} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>cancel</button>
            </div>
          </>
        ) : (
          <>
            <span onClick={() => onStartEdit(b)} title="click to edit"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, lineHeight: 1.4, wordBreak: "break-word", cursor: "pointer" }}>
              {b.url
                ? <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                    onClick={e => e.stopPropagation()}>{b.title}</a>
                : b.title}
            </span>
            {b.author && <span onClick={() => onStartEdit(b)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, cursor: "pointer" }}>{b.author}</span>}
            {b.finishedDate && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{b.finishedDate}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function BookRow({ book: b, C, onDelete, editingId, editDraft, setEditDraft, onStartEdit, onCommitEdit, onCancelEdit, fetchingBook }: { book: BookEntry; C: Palette; onDelete: (id: string) => void } & EditingProps) {
  const isEditing = editingId === b.id;
  const inputSt: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
    padding: "3px 7px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, outline: "none",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 36, flexShrink: 0, aspectRatio: "2/3", borderRadius: 3, overflow: "hidden", background: C.surfaceHi, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {fetchingBook === b.id
          ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: C.textFaint }}>…</span>
          : b.cover
            ? <img src={b.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : null}
      </div>
      <button onClick={() => onDelete(b.id)} title="delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textFaint, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
      {isEditing ? (
        <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 6, alignItems: "center" }}>
          <input autoFocus value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") onCommitEdit(b.id); if (e.key === "Escape") onCancelEdit(); }}
            style={{ ...inputSt, flex: "2 1 0" }} />
          <input value={editDraft.author} onChange={e => setEditDraft(d => ({ ...d, author: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") onCommitEdit(b.id); if (e.key === "Escape") onCancelEdit(); }}
            placeholder="author" style={{ ...inputSt, flex: "1 1 0" }} />
          <button onClick={() => onCommitEdit(b.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, flexShrink: 0 }}>save</button>
          <button onClick={onCancelEdit} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>cancel</button>
        </div>
      ) : (
        <span onClick={() => onStartEdit(b)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text, flex: 1, minWidth: 0, cursor: "pointer" }}>
          {b.url
            ? <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                onClick={e => e.stopPropagation()}>{b.title}</a>
            : b.title}
          {b.author && <span style={{ color: C.textFaint }}> · {b.author}</span>}
        </span>
      )}
      {b.finishedDate && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>{fmtDate(b.finishedDate)}</span>}
    </div>
  );
}
