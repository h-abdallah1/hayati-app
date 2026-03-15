"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { loadGames, persistGames } from "@/lib/gameList";
import { toDateKey } from "@/app/overview/helpers";
import type { GameEntry, GamePlatform } from "@/lib/types";
import { SiPlaystation, SiSteam, SiSteamdeck, SiApple, SiAndroid } from "react-icons/si";
import { Monitor, Gamepad2, Gamepad } from "lucide-react";

const PLATFORMS: GamePlatform[] = [
  "Nintendo Switch", "PlayStation 5", "PlayStation 4",
  "Steam Deck", "PC", "Xbox Series X/S", "Xbox One",
  "iOS", "Android", "Other",
];

type ViewMode = "grid" | "timeline";
type Palette = ReturnType<typeof useTheme>;

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

const PLATFORM_ICON: Record<GamePlatform, { icon: React.ReactNode; color: string }> = {
  "Nintendo Switch":  { icon: <Gamepad       size={11} />, color: "#e4000f" },
  "PlayStation 5":    { icon: <SiPlaystation size={11} />, color: "#003087" },
  "PlayStation 4":    { icon: <SiPlaystation size={11} />, color: "#003087" },
  "Steam Deck":       { icon: <SiSteamdeck   size={11} />, color: "#1b2838" },
  "PC":               { icon: <SiSteam       size={11} />, color: "#6b7280" },
  "Xbox Series X/S":  { icon: <Gamepad2      size={11} />, color: "#107c10" },
  "Xbox One":         { icon: <Gamepad2      size={11} />, color: "#107c10" },
  "iOS":              { icon: <SiApple       size={11} />, color: "#555555" },
  "Android":          { icon: <SiAndroid     size={11} />, color: "#3ddc84" },
  "Other":            { icon: <Monitor       size={11} />, color: "#6b7280" },
};

function PlatformBadge({ platform, C }: { platform: GamePlatform; C: Palette }) {
  const { icon, color } = PLATFORM_ICON[platform] ?? PLATFORM_ICON["Other"];
  return (
    <span title={platform} style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      color, border: `1px solid ${C.border}`,
      borderRadius: 3, padding: "2px 5px", lineHeight: 1,
      fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
    }}>
      {icon}
      <span style={{ color: C.textFaint }}>{platform}</span>
    </span>
  );
}

const EMPTY_FORM = { title: "", platform: "PC" as GamePlatform, date: "", cover: "", url: "" };

export default function GamingPage() {
  const C = useTheme();

  const [gameList,       setGameList]       = useState<GameEntry[]>([]);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editDraft,      setEditDraft]      = useState({ title: "", platform: "PC" as GamePlatform });
  const [view,           setView]           = useState<ViewMode>("grid");
  const [search,         setSearch]         = useState("");
  const [adding,         setAdding]         = useState(false);
  const [form,           setForm]           = useState({ ...EMPTY_FORM, date: toDateKey(new Date()) });
  const [fetchingCovers, setFetchingCovers] = useState(false);
  const [coverProgress,  setCoverProgress]  = useState("");

  useEffect(() => { setGameList(loadGames()); }, []);

  const deleteGame = (id: string) => {
    const next = gameList.filter(g => g.id !== id);
    setGameList(next);
    persistGames(next);
  };

  const startEdit  = (g: GameEntry) => { setEditingId(g.id); setEditDraft({ title: g.title, platform: g.platform }); };
  const commitEdit = (id: string) => {
    const title = editDraft.title.trim();
    if (!title) return;
    const next = gameList.map(g => g.id === id ? { ...g, title, platform: editDraft.platform } : g);
    setGameList(next);
    persistGames(next);
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const exportCSV = () => {
    const rows = [
      ["title", "platform", "rating", "finishedDate", "url"],
      ...gameList.map(g => [g.title, g.platform, g.rating ?? "", g.finishedDate ?? "", g.url ?? ""]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "games.csv";
    a.click();
  };

  const fetchAllCovers = async () => {
    const missing = gameList.filter(g => !g.cover);
    if (!missing.length) return;
    setFetchingCovers(true);
    let updated = [...gameList];
    for (let i = 0; i < missing.length; i++) {
      const g = missing[i];
      setCoverProgress(`${i + 1} / ${missing.length}`);
      try {
        const res = await fetch("/api/sgdb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: g.title }),
        });
        const { cover } = await res.json() as { cover: string | null };
        if (cover) {
          updated = updated.map(x => x.id === g.id ? { ...x, cover } : x);
          setGameList([...updated]);
        }
      } catch {}
      await new Promise(r => setTimeout(r, 300));
    }
    persistGames(updated);
    setFetchingCovers(false);
    setCoverProgress("");
  };

  const saveGame = () => {
    if (!form.title.trim()) return;
    const entry: GameEntry = {
      id: crypto.randomUUID(),
      title:    form.title.trim(),
      platform: form.platform,
      cover:    form.cover.trim() || undefined,
      addedAt:  new Date(form.date || toDateKey(new Date())).toISOString(),
      finishedDate: form.date || toDateKey(new Date()),
      url:      form.url.trim() || undefined,
    };
    const next = [...gameList, entry];
    setGameList(next);
    persistGames(next);
    setForm({ ...EMPTY_FORM, date: toDateKey(new Date()) });
    setAdding(false);
  };

  const cancel = () => { setAdding(false); setForm({ ...EMPTY_FORM, date: toDateKey(new Date()) }); };
  const onKey  = (e: React.KeyboardEvent) => { if (e.key === "Enter") saveGame(); if (e.key === "Escape") cancel(); };

  const DEFAULT_DATE = "2025-12-31";
  const now       = new Date();
  const thisYear  = String(now.getFullYear());
  const countYear = gameList.filter(g => (g.finishedDate ?? DEFAULT_DATE).startsWith(thisYear)).length;

  const platformCounts = gameList.reduce<Record<string, number>>((acc, g) => {
    acc[g.platform] = (acc[g.platform] ?? 0) + 1;
    return acc;
  }, {});
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];

  const filtered = gameList
    .filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const da = a.finishedDate ?? DEFAULT_DATE;
      const db = b.finishedDate ?? DEFAULT_DATE;
      if (da !== db) return db.localeCompare(da);
      return b.addedAt.localeCompare(a.addedAt);
    });

  const byMonth = filtered.reduce<Record<string, GameEntry[]>>((acc, g) => {
    const key = (g.finishedDate ?? DEFAULT_DATE).slice(0, 7);
    (acc[key] ??= []).push(g);
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

  const editingProps = { editingId, editDraft, setEditDraft, onStartEdit: startEdit, onCommitEdit: commitEdit, onCancelEdit: cancelEdit };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingLeft: 72, paddingRight: 32, paddingTop: 32, paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em" }}>GAMING</span>
        <button onClick={exportCSV} style={{ ...btnBase, marginLeft: "auto", color: C.textMuted, borderColor: C.border }}>export csv</button>
        <button onClick={fetchAllCovers} disabled={fetchingCovers} style={{ ...btnBase, color: C.textMuted, borderColor: C.border }}>
          {fetchingCovers ? `fetching covers ${coverProgress}` : "fetch covers"}
        </button>
        <button onClick={() => setAdding(true)} style={{ ...btnBase, color: C.accent, borderColor: C.accentMid }}>+ add game</button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ marginBottom: 24, padding: "14px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginBottom: 2 }}>ADD GAME</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="title (required)" onKeyDown={onKey} style={{ ...inputSt, flex: "2 1 180px" }} />
            <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as GamePlatform }))} style={{ ...inputSt, flex: "1 1 160px", cursor: "pointer" }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} onKeyDown={onKey} style={{ ...inputSt, flex: "1 1 140px" }} />
            <input value={form.cover} onChange={e => setForm(f => ({ ...f, cover: e.target.value }))} placeholder="cover url (optional)" onKeyDown={onKey} style={{ ...inputSt, flex: "2 1 180px" }} />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="url (optional)" onKeyDown={onKey} style={{ ...inputSt, flex: "2 1 180px" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveGame} style={{ ...btnBase, color: C.accent, borderColor: C.accentMid }}>save</button>
            <button onClick={cancel} style={{ ...btnBase, color: C.textFaint }}>cancel</button>
          </div>
        </div>
      )}

      {/* Controls */}
      {gameList.length > 0 && (
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
      {gameList.length > 0 && (
        <div style={{ display: "flex", gap: 24, marginBottom: 20, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {[
            { val: gameList.length, label: "total" },
            { val: countYear,       label: "this year" },
            ...(topPlatform ? [{ val: topPlatform[1], label: topPlatform[0] }] : []),
          ].map(s => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text }}>{s.val}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {gameList.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          no games yet — click <span style={{ color: C.accent }}>+ add game</span> to get started
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>no results</div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 16 }}>
          {filtered.map(g => <GameCard key={g.id} game={g} C={C} onDelete={deleteGame} {...editingProps} />)}
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
                    {byMonth[month].length} game{byMonth[month].length !== 1 ? "s" : ""}
                  </span>
                </div>
                {byMonth[month].map(g => (
                  <div key={g.id} style={{ position: "relative", paddingBottom: 20 }}>
                    <div style={{ position: "absolute", left: -29, top: 10, width: 8, height: 8, borderRadius: "50%", background: C.teal }} />
                    <GameRow game={g} C={C} onDelete={deleteGame} {...editingProps} />
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
  editDraft: { title: string; platform: GamePlatform };
  setEditDraft: React.Dispatch<React.SetStateAction<{ title: string; platform: GamePlatform }>>;
  onStartEdit: (g: GameEntry) => void;
  onCommitEdit: (id: string) => void;
  onCancelEdit: () => void;
}

function GameCard({ game: g, C, onDelete, editingId, editDraft, setEditDraft, onStartEdit, onCommitEdit, onCancelEdit }: { game: GameEntry; C: Palette; onDelete: (id: string) => void } & EditingProps) {
  const isEditing = editingId === g.id;
  const inputSt: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
    padding: "4px 7px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
    color: C.text, outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 6, overflow: "hidden", background: C.surfaceHi, border: `1px solid ${C.border}`, position: "relative" }}>
        {g.cover
          ? <img src={g.cover} alt={g.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: C.border }}>⬛</span>
            </div>
        }
        <button onClick={() => onDelete(g.id)} title="delete" style={{
          position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.55)", border: "none",
          borderRadius: 3, cursor: "pointer", fontSize: 11, color: "#fff", width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
        >×</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {isEditing ? (
          <>
            <input autoFocus value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") onCommitEdit(g.id); if (e.key === "Escape") onCancelEdit(); }} style={inputSt} />
            <select value={editDraft.platform} onChange={e => setEditDraft(d => ({ ...d, platform: e.target.value as GamePlatform }))}
              style={{ ...inputSt, cursor: "pointer", marginTop: 2 }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              <button onClick={() => onCommitEdit(g.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.accent }}>save</button>
              <button onClick={onCancelEdit} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>cancel</button>
            </div>
          </>
        ) : (
          <>
            <span onClick={() => onStartEdit(g)} title="click to edit"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, lineHeight: 1.4, wordBreak: "break-word", cursor: "pointer" }}>
              {g.url
                ? <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                    onClick={e => e.stopPropagation()}>{g.title}</a>
                : g.title}
            </span>
            <PlatformBadge platform={g.platform} C={C} />
            {g.finishedDate && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{g.finishedDate}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function GameRow({ game: g, C, onDelete, editingId, editDraft, setEditDraft, onStartEdit, onCommitEdit, onCancelEdit }: { game: GameEntry; C: Palette; onDelete: (id: string) => void } & EditingProps) {
  const isEditing = editingId === g.id;
  const inputSt: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
    padding: "3px 7px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, outline: "none",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 36, flexShrink: 0, aspectRatio: "3/4", borderRadius: 3, overflow: "hidden", background: C.surfaceHi, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {g.cover && <img src={g.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      </div>
      <button onClick={() => onDelete(g.id)} title="delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textFaint, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
      {isEditing ? (
        <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 6, alignItems: "center" }}>
          <input autoFocus value={editDraft.title} onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") onCommitEdit(g.id); if (e.key === "Escape") onCancelEdit(); }}
            style={{ ...inputSt, flex: "2 1 0" }} />
          <select value={editDraft.platform} onChange={e => setEditDraft(d => ({ ...d, platform: e.target.value as GamePlatform }))}
            style={{ ...inputSt, flex: "1 1 0", cursor: "pointer" }}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => onCommitEdit(g.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, flexShrink: 0 }}>save</button>
          <button onClick={onCancelEdit} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>cancel</button>
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <span onClick={() => onStartEdit(g)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text, cursor: "pointer" }}>
            {g.url
              ? <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ color: C.text, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                  onClick={e => e.stopPropagation()}>{g.title}</a>
              : g.title}
          </span>
          <PlatformBadge platform={g.platform} C={C} />
        </div>
      )}
      {g.finishedDate && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, flexShrink: 0 }}>{fmtDate(g.finishedDate)}</span>}
    </div>
  );
}
