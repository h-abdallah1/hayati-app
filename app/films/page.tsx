"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks";
import { Tag, Dot } from "@/components/ui";
import type { FilmEntry } from "@/lib/types";

function stars(r: number): string {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

type SortMode = "newest" | "rating";
type FilterMode = "all" | "3plus" | "4plus";
type ViewMode = "grid" | "timeline";


export default function FilmsPage() {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const { global } = useGlobalSettings();
  const username = global.letterboxdUsername ?? "";
  const hasSource = !!username || global.demoMode;
  const { films, loaded, refresh } = useLetterboxd(username);

  const [sort, setSort] = useState<SortMode>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [likedOnly, setLikedOnly] = useState(false);
  const [rewatchOnly, setRewatchOnly] = useState(false);
  const [selected, setSelected] = useState<FilmEntry | null>(null);

  useEffect(() => { setSearch(""); setLikedOnly(false); setRewatchOnly(false); }, [username]);

  const filtered = films
    .filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()))
    .filter(f => filter === "3plus" ? (f.rating ?? 0) >= 3 : filter === "4plus" ? (f.rating ?? 0) >= 4 : true)
    .filter(f => !likedOnly || f.liked)
    .filter(f => !rewatchOnly || f.rewatch);

  const sorted = [...filtered].sort((a, b) => {
    if (view === "timeline" || sort === "newest") return b.watchedDate.localeCompare(a.watchedDate);
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  const avgRating = films.length > 0 && films.some(f => f.rating !== undefined)
    ? (films.reduce((s, f) => s + (f.rating ?? 0), 0) / films.filter(f => f.rating !== undefined).length).toFixed(1)
    : null;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisYear = String(now.getFullYear());
  const countThisMonth = films.filter(f => f.watchedDate.startsWith(thisMonth)).length;
  const countThisYear = films.filter(f => f.watchedDate.startsWith(thisYear)).length;

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

  return (
    <div style={{
      minHeight: "100vh", padding: "28px 32px",
      background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
      backdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
      WebkitBackdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: C.text }}>FILMS</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dot size={4} />
          <Tag color={C.textMuted}>
            {!hasSource ? "not configured" : loaded ? "live" : "loading..."}
          </Tag>
        </div>
        {hasSource && loaded && !global.demoMode && (
          <button
            onClick={refresh}
            style={{ ...btnBase, color: C.textFaint, marginLeft: "auto" }}
          >
            refresh
          </button>
        )}
      </div>

      {/* Stats bar */}
      {loaded && films.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20, padding: "10px 14px", background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)", backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)", borderRadius: 8, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text }}>{films.length}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>films in feed</span>
          </div>
          {avgRating && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.accent }}>{avgRating}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>avg rating</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text }}>{countThisMonth}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>this month</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text }}>{countThisYear}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>this year</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {hasSource && loaded && films.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["grid", "timeline"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={activeBtn(view === v)}>{v}</button>
            ))}
          </div>
          {view === "grid" && (
            <div style={{ display: "flex", gap: 4 }}>
              {(["newest", "rating"] as SortMode[]).map(s => (
                <button key={s} onClick={() => setSort(s)} style={activeBtn(sort === s)}>
                  {s === "newest" ? "newest" : "by rating"}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {([["all", "all"], ["3plus", "★★★+"], ["4plus", "★★★★+"]] as [FilterMode, string][]).map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f)} style={activeBtn(filter === f)}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setLikedOnly(v => !v)} style={activeBtn(likedOnly)}>♥ liked</button>
          <button onClick={() => setRewatchOnly(v => !v)} style={activeBtn(rewatchOnly)}>↺ rewatch</button>
          <div style={{ flex: 1 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search titles…"
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              padding: "3px 9px",
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              background: C.surfaceHi,
              color: C.text,
              outline: "none",
              maxWidth: 200,
              lineHeight: 1.6,
            }}
          />
        </div>
      )}

      {/* Content */}
      {!hasSource ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          no films — add your Letterboxd username in settings
        </div>
      ) : !loaded ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          loading...
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textFaint, paddingTop: 40, textAlign: "center" }}>
          no films found
        </div>
      ) : view === "grid" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 16,
        }}>
          {sorted.map((film: FilmEntry, i: number) => (
            <FilmCard key={i} film={film} C={C} onSelect={setSelected} />
          ))}
        </div>
      ) : (
        <TimelineView films={sorted} C={C} onSelect={setSelected} />
      )}

      <FilmDrawer film={selected} C={C} onClose={() => setSelected(null)} />
    </div>
  );
}

type Palette = ReturnType<typeof useTheme>;

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function TimelineView({ films, C, onSelect }: { films: FilmEntry[]; C: Palette; onSelect: (f: FilmEntry) => void }) {
  const byMonth = films.reduce<Record<string, FilmEntry[]>>((acc, f) => {
    const key = f.watchedDate.slice(0, 7);
    (acc[key] ??= []).push(f);
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Single continuous vertical line wrapping everything */}
      <div style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 24 }}>
        {months.map(month => (
          <div key={month}>
            {/* Month header — sits on the line with a diamond marker */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingTop: 4 }}>
              <div style={{
                position: "absolute",
                left: -29,
                width: 8,
                height: 8,
                borderRadius: 2,
                background: C.border,
                transform: "rotate(45deg)",
              }} />
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text }}>
                {monthLabel(month)}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
                {byMonth[month].length} film{byMonth[month].length !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Entries */}
            {byMonth[month].map((film, i) => (
              <div
                key={i}
                onClick={() => onSelect(film)}
                style={{ position: "relative", display: "flex", gap: 14, paddingBottom: 24, cursor: "pointer" }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: "absolute",
                  left: -29,
                  top: 24,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: C.accent,
                }} />
                {/* Day badge */}
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: C.textFaint,
                  width: 20,
                  flexShrink: 0,
                  paddingTop: 6,
                }}>
                  {film.watchedDate.slice(8)}
                </div>
                {/* Poster */}
                <div style={{
                  width: 48,
                  flexShrink: 0,
                  aspectRatio: "2/3",
                  borderRadius: 4,
                  overflow: "hidden",
                  background: C.surfaceHi,
                  border: `1px solid ${C.border}`,
                }}>
                  {film.poster && (
                    <img
                      src={film.poster}
                      alt={film.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                {/* Text info */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text, fontWeight: 600 }}>
                    {film.title}
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {film.year && <span style={{ fontSize: 10, color: C.textFaint }}>{film.year}</span>}
                    {film.rating !== undefined && <span style={{ fontSize: 10, color: C.accent }}>{stars(film.rating)}</span>}
                    {film.liked && <span style={{ fontSize: 10, color: "#e05252" }}>♥</span>}
                    {film.rewatch && <span style={{ fontSize: 10, color: C.textFaint }}>↺</span>}
                  </div>
                  {film.review && (
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: C.textFaint,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {film.review}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilmDrawer({ film, C, onClose }: { film: FilmEntry | null; C: Palette; onClose: () => void }) {
  const { isDark } = useThemeToggle();
  const open = film !== null;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}
      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100%",
        width: 360,
        zIndex: 50,
        background: isDark ? "rgba(10, 10, 18, 0.60)" : "rgba(248, 248, 244, 0.68)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        borderLeft: `1px solid ${C.border}`,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>
        {film && (
          <>
            {/* Poster */}
            {film.poster && (
              <div style={{ width: "100%", aspectRatio: "2/3", flexShrink: 0, position: "relative" }}>
                <img
                  src={film.poster}
                  alt={film.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}
            {/* Content */}
            <div style={{ padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Close button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 10,
                    color: C.textFaint,
                    padding: "2px 8px",
                  }}
                >
                  ✕ close
                </button>
              </div>
              {/* Title + link */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.3, flex: 1 }}>
                  {film.title}
                </span>
                {film.url && (
                  <a
                    href={film.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: C.accent, textDecoration: "none", fontSize: 14, flexShrink: 0, marginTop: 2 }}
                    title="View on Letterboxd"
                  >
                    ↗
                  </a>
                )}
              </div>
              {/* Year + date */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {film.year && (
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>{film.year}</span>
                )}
                {film.year && <span style={{ color: C.textFaint, fontSize: 10 }}>·</span>}
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>{film.watchedDate}</span>
              </div>
              {/* Rating + badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {film.rating !== undefined && (
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.accent, letterSpacing: "1px" }}>
                    {stars(film.rating)}
                  </span>
                )}
                {film.liked && (
                  <span style={{ fontSize: 12, color: "#e05252" }} title="Liked">♥ liked</span>
                )}
                {film.rewatch && (
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }} title="Rewatch">↺ rewatch</span>
                )}
              </div>
              {/* Divider */}
              <div style={{ height: 1, background: C.border }} />
              {/* Review */}
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                color: film.review ? C.text : C.textFaint,
                lineHeight: 1.7,
              }}>
                {film.review ?? "no review written"}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FilmCard({ film, C, onSelect }: { film: FilmEntry; C: Palette; onSelect: (f: FilmEntry) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Poster */}
      <div
        onClick={() => onSelect(film)}
        style={{
          width: "100%",
          aspectRatio: "2/3",
          borderRadius: 6,
          overflow: "hidden",
          background: C.surfaceHi,
          border: `1px solid ${C.border}`,
          cursor: "pointer",
        }}
      >
        {film.poster ? (
          <img
            src={film.poster}
            alt={film.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "10px 8px", background: "linear-gradient(160deg, #2a2a3a 0%, #0e0e16 100%)" }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {film.title}
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          {film.url ? (
            <a
              href={film.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, textDecoration: "none", lineHeight: 1.4, wordBreak: "break-word" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = C.text)}
            >
              {film.title}
            </a>
          ) : (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, lineHeight: 1.4, wordBreak: "break-word" }}>{film.title}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {film.year && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{film.year}</span>}
          {film.liked && <span style={{ fontSize: 9, color: "#e05252" }} title="Liked">♥</span>}
          {film.rewatch && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }} title="Rewatch">↺</span>}
        </div>
        {film.rating !== undefined && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.accent, letterSpacing: "1px" }}>
            {stars(film.rating)}
          </span>
        )}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{film.watchedDate}</span>
      </div>
    </div>
  );
}
