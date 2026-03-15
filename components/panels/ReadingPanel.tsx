"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { usePanelSize } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";
import type { BookEntry } from "@/lib/types";
import { loadBooks } from "@/lib/bookList";

export function ReadingPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);

  const [books, setBooks] = useState<BookEntry[]>([]);

  useEffect(() => {
    setBooks(loadBooks());
  }, []);

  const current = books.sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0] ?? null;
  const smRead  = height > 0 && height < 200;

  return (
    <Panel ref={ref} style={{ padding: smRead ? 14 : 20 }}>
      <div className="hayati-drag-handle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: smRead ? 8 : 14 }}>
        <Tag color={C.textFaint}>Reading</Tag>
      </div>

      {current ? (
        <div style={{ display: "flex", gap: smRead ? 10 : 14, alignItems: "flex-start" }}>
          <div style={{ width: 56, height: smRead ? 78 : 78, borderRadius: smRead ? 5 : 6, flexShrink: 0, background: C.surfaceHi, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current.cover
              ? <img src={current.cover} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: smRead ? 14 : 18, color: C.border }}>▣</span>
            }
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: smRead ? 12 : 13, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{current.title}</div>
            {current.author && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{current.author}</div>}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>No books logged</span>
        </div>
      )}
    </Panel>
  );
}
