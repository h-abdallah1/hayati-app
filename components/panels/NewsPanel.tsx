"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { usePanelSettings } from "@/lib/settings";
import { useNews } from "@/lib/hooks";
import { NEWS } from "@/lib/data";
import { Panel, Tag, Dot } from "@/components/ui";
import type { NewsItem } from "@/lib/types";

const PAGE_SIZE = 5;

export function NewsPanel() {
  const C = useTheme();
  const router = useRouter();
  const { panels } = usePanelSettings();
  const { items: liveItems, loaded } = useNews(panels.newsFeeds);
  const [page, setPage] = useState(0);

  const displayItems: NewsItem[] = panels.newsFeeds.length === 0
    ? (NEWS as NewsItem[])
    : (loaded ? liveItems : (NEWS as NewsItem[]));

  const totalPages = Math.ceil(displayItems.length / PAGE_SIZE);
  const pageItems = displayItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const feedsKey = panels.newsFeeds.map(f => f.url).join("|");
  useEffect(() => { setPage(0); }, [displayItems.length, feedsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <Panel style={{ gridColumn:"span 2" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Tag color={C.textFaint}>Latest news</Tag>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Dot size={4} />
            <Tag color={C.textMuted}>{panels.newsFeeds.length > 0 ? "live" : "static"}</Tag>
          </div>
        </div>
        {totalPages > 1 && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={btnStyle(page === 0)}>&#8249;</button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint }}>
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={btnStyle(page === totalPages - 1)}>&#8250;</button>
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column" }}>
        {pageItems.map((n, i) => (
          <div key={`${page}-${i}`}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 0" }}>
              {/* Source + author */}
              <div style={{ width:80, flexShrink:0, display:"flex", flexDirection:"column", gap:2, paddingTop:2 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.accent, fontWeight:700, letterSpacing:"0.3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {n.source.toUpperCase()}
                </span>
                {n.author && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:C.textFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {n.author}
                  </span>
                )}
              </div>
              {/* Title */}
              {n.url ? (
                <a
                  href={n.url}
                  rel="noopener noreferrer"
                  onClick={e => { e.preventDefault(); router.push(`/reader?url=${encodeURIComponent(n.url!)}`); }}
                  style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, lineHeight:1.55, flex:1, textDecoration:"none", cursor:"pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                >
                  {n.title}
                </a>
              ) : (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text, lineHeight:1.55, flex:1 }}>{n.title}</span>
              )}
              {/* Thumbnail */}
              {n.image && (
                <img
                  src={n.image}
                  alt=""
                  style={{ width:40, height:40, objectFit:"cover", borderRadius:3, flexShrink:0, border:`1px solid ${C.border}` }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textFaint, flexShrink:0, paddingTop:2 }}>{n.time}</span>
            </div>
            {i < pageItems.length - 1 && <div style={{ height:1, background:C.border }} />}
          </div>
        ))}
      </div>
    </Panel>
  );
}
