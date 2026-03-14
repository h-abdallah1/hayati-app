"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { usePanelSize } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";
import type { GameEntry } from "@/lib/types";
import { loadGames } from "@/lib/gameList";

export function GamingPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);

  const [games, setGames] = useState<GameEntry[]>([]);

  useEffect(() => {
    setGames(loadGames());
  }, []);

  const current =
    games.find(g => g.status === "playing") ??
    games.sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0] ??
    null;

  const smRead = height > 0 && height < 200;

  const statusLabel = (g: GameEntry) => {
    if (g.status === "playing")   return { label: "▶ playing",   color: C.accent };
    if (g.status === "completed") return { label: "✓ completed", color: C.teal };
    if (g.status === "dropped")   return { label: "✗ dropped",   color: C.red ?? "#ef4444" };
    return { label: "○ backlog", color: C.textMuted };
  };

  return (
    <Panel ref={ref} style={{ padding: smRead ? 14 : 20 }}>
      <div className="hayati-drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: smRead ? 8 : 14 }}>
        <Tag color={C.textFaint}>Gaming</Tag>
        <Link href="/gaming" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, textDecoration: "none" }}>
          all →
        </Link>
      </div>

      {current ? (
        <div style={{ display: "flex", gap: smRead ? 10 : 14, alignItems: "flex-start" }}>
          <div style={{
            width: 56, height: smRead ? 68 : 78, borderRadius: smRead ? 4 : 6,
            flexShrink: 0, background: C.surfaceHi, border: `1px solid ${C.border}`,
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {current.cover
              ? <img src={current.cover} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: smRead ? 14 : 18, color: C.border }}>⬛</span>
            }
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: smRead ? 12 : 13, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{current.title}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{current.platform}</div>
            {!smRead && (() => { const { label, color } = statusLabel(current); return (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color }}>{label}</span>
            ); })()}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>No games yet</span>
        </div>
      )}
    </Panel>
  );
}
