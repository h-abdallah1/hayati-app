"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { usePanelSize } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";
import type { BookEntry } from "@/lib/types";
import { loadBooks, persistBooks } from "@/lib/bookList";

const OLD_KEY = "hayati-current-book";

export function ReadingPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);

  const [books, setBooks] = useState<BookEntry[]>([]);

  useEffect(() => {
    let list = loadBooks();
    if (list.length === 0) {
      try {
        const raw = localStorage.getItem(OLD_KEY);
        if (raw) {
          const old = JSON.parse(raw) as { title?: string; author?: string; cover?: string };
          if (old.title) {
            list = [{
              id: crypto.randomUUID(),
              title: old.title,
              author: old.author ?? "",
              status: "reading",
              cover: old.cover,
              addedAt: new Date().toISOString(),
            }];
            persistBooks(list);
          }
        }
      } catch {}
    }
    setBooks(list);
  }, []);

  const current = books
    .filter(b => b.status === "reading")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0] ?? null;

  const smRead = height > 0 && height < 200;

  return (
    <Panel ref={ref} style={{ padding: smRead ? 14 : 20 }}>
      <div className="hayati-drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: smRead ? 8 : 14 }}>
        <Tag color={C.textFaint}>Reading</Tag>
      </div>

      {current ? (
        smRead ? (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 78, borderRadius: 5, flexShrink: 0, background: C.surfaceHi, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {current.cover
                ? <img src={current.cover} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.border }}>▣</span>
              }
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{current.title}</div>
              {current.author && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{current.author}</div>}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 78, borderRadius: 6, flexShrink: 0, background: C.surfaceHi, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {current.cover
                ? <img src={current.cover} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color: C.border }}>▣</span>
              }
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", height: 78 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 5 }}>{current.title}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>{current.author}</div>
            </div>
          </div>
        )
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>No books in progress</span>
        </div>
      )}
    </Panel>
  );
}
