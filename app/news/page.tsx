"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Star, X } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { usePanelSettings } from "@/lib/settings";
import { useNews } from "@/lib/hooks";
import { NEWS } from "@/lib/data";
import { Dot, Tag } from "@/components/ui";
import type { NewsItem } from "@/lib/types";

const PAGE_SIZE = 20;

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","are","was","were","be","been","has","have","had","will","would",
  "could","should","may","might","do","does","did","not","no","as","it","its",
  "this","that","than","then","so","if","up","about","after","before","over",
  "under","into","out","new","what","how","why","who","when","where","which",
  "says","said","say","between","during","since","without","within","through",
  "against","more","also","just","all","one","two","three","after","here",
]);

const TOPICS: Record<string, string[]> = {
  tech:     ["ai","tech","apple","google","microsoft","software","data","robot","digital","cyber","chip","phone","app","openai","meta","amazon","tesla"],
  politics: ["election","president","congress","senate","vote","democrat","republican","government","political","parliament","minister","policy","law","court","supreme","trump","biden"],
  finance:  ["market","stock","bank","economy","inflation","fed","rate","crypto","bitcoin","price","trade","gdp","billion","million","fund","dollar","nasdaq"],
  science:  ["space","nasa","climate","research","study","scientist","planet","discovery","quantum","gene","vaccine","covid","health","medical","physics"],
  sports:   ["game","win","team","player","championship","league","football","basketball","soccer","olympics","coach","match","tournament","nfl","nba"],
  world:    ["war","conflict","ukraine","russia","china","israel","gaza","iran","north korea","summit","treaty","sanction","nato"],
};

function getTopics(title: string): string[] {
  const lower = title.toLowerCase();
  return Object.keys(TOPICS).filter(t => TOPICS[t].some(kw => lower.includes(kw)));
}

function readingMins(title: string): number {
  return Math.max(1, Math.ceil(title.split(/\s+/).length / 5));
}

function itemId(n: { url?: string; title: string }): string {
  return n.url ?? n.title;
}

export default function NewsPage() {
  const C = useTheme();
  const router = useRouter();
  const { panels } = usePanelSettings();
  const { items: liveItems, loaded, refresh } = useNews(panels.newsFeeds);
  const [page, setPage] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "grouped">("newest");
  const [hideRead, setHideRead] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Read tracker (resets each day via key)
  const readKey = `hayati-news-read-${new Date().toISOString().slice(0, 10)}`;
  const [readItems, setReadItems] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(readKey) ?? "{}"); } catch { return {}; }
  });
  const markRead = (id: string) => {
    const next = { ...readItems, [id]: true };
    setReadItems(next);
    try { localStorage.setItem(readKey, JSON.stringify(next)); } catch {}
  };
  const unmarkRead = (id: string) => {
    const next = { ...readItems };
    delete next[id];
    setReadItems(next);
    try { localStorage.setItem(readKey, JSON.stringify(next)); } catch {}
  };

  // Bookmarks (persistent)
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("hayati-news-bookmarks") ?? "[]")); } catch { return new Set(); }
  });
  const toggleBookmark = (id: string) => {
    const next = new Set(bookmarks);
    if (next.has(id)) next.delete(id); else next.add(id);
    setBookmarks(next);
    try { localStorage.setItem("hayati-news-bookmarks", JSON.stringify([...next])); } catch {}
  };

  const allItems: NewsItem[] = panels.newsFeeds.length === 0
    ? (NEWS as NewsItem[])
    : loaded ? liveItems : (NEWS as NewsItem[]);

  // Source counts
  const sourceCounts: Record<string, number> = {};
  for (const n of allItems) sourceCounts[n.source] = (sourceCounts[n.source] ?? 0) + 1;
  const sources = ["all", ...Array.from(new Set(allItems.map(n => n.source))), "saved"];

  // Topic counts
  const topicCounts: Record<string, number> = {};
  for (const n of allItems) {
    for (const t of getTopics(n.title)) topicCounts[t] = (topicCounts[t] ?? 0) + 1;
  }
  const activeTopics = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a]);

  // Top words
  const feedsKey = panels.newsFeeds.map(f => f.url).join("|");
  const topWords = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of allItems) {
      for (const word of n.title.toLowerCase().split(/\W+/)) {
        if (word.length > 3 && !STOPWORDS.has(word)) {
          counts[word] = (counts[word] ?? 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word]) => word);
  }, [feedsKey, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtering pipeline
  let filtered = allItems;
  if (sourceFilter === "saved") {
    filtered = filtered.filter(n => bookmarks.has(itemId(n)));
  } else if (sourceFilter !== "all") {
    filtered = filtered.filter(n => n.source === sourceFilter);
  }
  if (topicFilter !== "all") {
    filtered = filtered.filter(n => getTopics(n.title).includes(topicFilter));
  }
  if (query) {
    filtered = filtered.filter(n => n.title.toLowerCase().includes(query.toLowerCase()));
  }
  if (hideRead) {
    filtered = filtered.filter(n => !readItems[itemId(n)]);
  }

  // Sort
  const sorted = sort === "grouped"
    ? [...filtered].sort((a, b) => a.source.localeCompare(b.source))
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [feedsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(0); }, [sourceFilter, topicFilter, query, hideRead, sort]);

  const isLive = panels.newsFeeds.length > 0;
  const isLoading = isLive && !loaded;
  const readCount = Object.keys(readItems).length;
  const savedCount = bookmarks.size;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 10,
    padding: "3px 10px",
    borderRadius: 5,
    border: `1px solid ${active ? C.accentMid : C.border}`,
    background: active ? C.accentDim : C.surface,
    color: active ? C.accent : C.textMuted,
    cursor: "pointer",
    letterSpacing: "0.3px",
    lineHeight: 1.6,
    display: "flex",
    alignItems: "center",
    gap: 5,
  });

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: "none",
    border: `1px solid ${C.border}`,
    borderRadius: 5,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11,
    color: disabled ? C.textFaint : C.textMuted,
    padding: "2px 8px",
    lineHeight: 1.6,
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 28px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: C.text }}>NEWS</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Dot size={4} />
              <Tag color={C.textMuted}>{isLive ? "live" : "static"}</Tag>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="search..."
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 5,
                padding: "4px 10px",
                color: C.text,
                outline: "none",
                width: 180,
              }}
            />
            {isLive && (
              <button
                onClick={refresh}
                disabled={isLoading}
                title="Refresh feeds"
                style={{
                  background: "none",
                  border: `1px solid ${C.border}`,
                  borderRadius: 5,
                  cursor: isLoading ? "default" : "pointer",
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  opacity: isLoading ? 0.4 : 1,
                  color: C.textMuted,
                }}
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {/* Sort toggle */}
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 5, overflow: "hidden" }}>
            {(["newest", "grouped"] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setSort(opt)}
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  padding: "3px 10px",
                  background: sort === opt ? C.accentDim : "none",
                  border: "none",
                  color: sort === opt ? C.accent : C.textFaint,
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Hide read */}
          <button
            onClick={() => setHideRead(h => !h)}
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              padding: "3px 10px",
              border: `1px solid ${hideRead ? C.accentMid : C.border}`,
              borderRadius: 5,
              background: hideRead ? C.accentDim : "none",
              color: hideRead ? C.accent : C.textFaint,
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            hide read{readCount > 0 ? ` · ${readCount}` : ""}
          </button>

          {/* Stats breakdown toggle */}
          <button
            onClick={() => setShowStats(s => !s)}
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              padding: "3px 10px",
              border: `1px solid ${showStats ? C.accentMid : C.border}`,
              borderRadius: 5,
              background: showStats ? C.accentDim : "none",
              color: showStats ? C.accent : C.textFaint,
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            breakdown
          </button>
        </div>

        {/* Source chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {sources.map(src => {
            const isSaved = src === "saved";
            const isAll = src === "all";
            const count = isAll ? allItems.length : isSaved ? savedCount : (sourceCounts[src] ?? 0);
            const hasItems = isAll || isSaved || count > 0;
            return (
              <button key={src} onClick={() => setSourceFilter(src)} style={chipStyle(sourceFilter === src)}>
                {!isAll && !isSaved && (
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: hasItems ? "#4ade80" : C.textFaint,
                    display: "inline-block",
                  }} />
                )}
                {isSaved && <Star size={9} />}
                {isAll ? `all · ${count}` : isSaved ? `saved · ${count}` : `${src} · ${count}`}
              </button>
            );
          })}
        </div>

        {/* Topic chips */}
        {activeTopics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setTopicFilter("all")} style={chipStyle(topicFilter === "all")}>
              all topics
            </button>
            {activeTopics.map(t => (
              <button key={t} onClick={() => setTopicFilter(t)} style={chipStyle(topicFilter === t)}>
                {t} · {topicCounts[t]}
              </button>
            ))}
          </div>
        )}

        {/* Top words */}
        {topWords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.4px" }}>
              TRENDING
            </span>
            {topWords.map(word => (
              <button
                key={word}
                onClick={() => setQuery(q => q === word ? "" : word)}
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 5,
                  border: `1px solid ${query === word ? C.accentMid : C.border}`,
                  background: query === word ? C.accentDim : "none",
                  color: query === word ? C.accent : C.textFaint,
                  cursor: "pointer",
                }}
              >
                {word}
              </button>
            ))}
          </div>
        )}

        {/* Stats breakdown */}
        {showStats && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.4px" }}>
              SOURCE BREAKDOWN
            </span>
            {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
              const pct = allItems.length > 0 ? count / allItems.length : 0;
              return (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textMuted,
                    width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{src}</span>
                  <div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${pct * 100}%`, height: "100%", background: C.accent, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, width: 28, textAlign: "right" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading / empty states */}
        {isLoading && (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, padding: "48px 0", textAlign: "center" }}>
            loading...
          </div>
        )}

        {!isLoading && panels.newsFeeds.length === 0 && (
          <div style={{ marginBottom: 16 }}>
            <Tag color={C.textFaint}>no feeds configured — add them in settings to see live articles</Tag>
          </div>
        )}

        {/* Article list */}
        {!isLoading && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {pageItems.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint, padding: "48px 0", textAlign: "center" }}>
                no articles
              </div>
            ) : pageItems.map((n, i) => {
              const id = itemId(n);
              const isRead = !!readItems[id];
              const isBookmarked = bookmarks.has(id);
              const mins = readingMins(n.title);
              const articleTopics = getTopics(n.title);
              return (
                <div key={`${page}-${i}`}>
                  <div style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "14px 16px",
                    background: C.surface,
                    opacity: isRead ? 0.45 : 1,
                    transition: "opacity 0.15s",
                  }}>
                    {/* Thumbnail — left side */}
                    {n.image && (
                      <img
                        src={n.image}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: `1px solid ${C.border}` }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}

                    {/* Content column */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>

                      {/* Meta row: source+author · · · time ★ × */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.accent,
                          fontWeight: 700, letterSpacing: "0.4px",
                        }}>
                          {n.source.toUpperCase()}
                        </span>
                        {n.author && (
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
                            · {n.author}
                          </span>
                        )}
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, whiteSpace: "nowrap" }}>
                            {n.time}
                          </span>
                          <button
                            onClick={() => toggleBookmark(id)}
                            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: isBookmarked ? C.accent : C.textFaint, flexShrink: 0, display: "flex" }}
                          >
                            <Star size={11} fill={isBookmarked ? C.accent : "none"} />
                          </button>
                          <button
                            onClick={() => isRead ? unmarkRead(id) : markRead(id)}
                            title={isRead ? "Mark unread" : "Dismiss"}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.textFaint, flexShrink: 0, display: "flex" }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      {n.url ? (
                        <a
                          href={n.url}
                          rel="noopener noreferrer"
                          onClick={e => { e.preventDefault(); markRead(id); router.push(`/reader?url=${encodeURIComponent(n.url!)}`); }}
                          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.text, lineHeight: 1.5, textDecoration: "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                        >
                          {n.title}
                        </a>
                      ) : (
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                          {n.title}
                        </span>
                      )}

                      {/* Description */}
                      {n.description && (
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint,
                          lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {n.description}
                        </span>
                      )}

                      {/* Tags + reading time */}
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        {articleTopics.map(t => (
                          <button
                            key={`kw-${t}`}
                            onClick={() => setTopicFilter(topicFilter === t ? "all" : t)}
                            style={{
                              fontFamily: "'JetBrains Mono',monospace", fontSize: 8, padding: "1px 5px",
                              borderRadius: 3, border: `1px solid ${topicFilter === t ? C.accentMid : C.border}`,
                              background: topicFilter === t ? C.accentDim : "none",
                              color: topicFilter === t ? C.accent : C.textFaint,
                              cursor: "pointer", letterSpacing: "0.3px",
                            }}
                          >
                            {t}
                          </button>
                        ))}
                        {n.categories?.map(cat => (
                          <span
                            key={`cat-${cat}`}
                            style={{
                              fontFamily: "'JetBrains Mono',monospace", fontSize: 8, padding: "1px 5px",
                              borderRadius: 3, border: `1px dashed ${C.border}`,
                              color: C.textFaint, letterSpacing: "0.3px",
                            }}
                          >
                            {cat}
                          </span>
                        ))}
                        <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, whiteSpace: "nowrap" }}>
                          ~{mins}m
                        </span>
                      </div>

                    </div>
                  </div>
                  {i < pageItems.length - 1 && <div style={{ height: 1, background: C.border }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 14 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={btnStyle(page === 0)}>&#8249;</button>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={btnStyle(page === totalPages - 1)}>&#8250;</button>
          </div>
        )}

      </div>
    </div>
  );
}
