"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd, usePanelSize } from "@/lib/hooks";
import { Panel, Tag, Dot } from "@/components/ui";

function stars(r: number): string {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

export function FilmsPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const router = useRouter();
  const { global } = useGlobalSettings();
  const username = global.letterboxdUsername ?? "";
  const { films, loaded } = useLetterboxd(username);

  const film = films[0] ?? null;
  // How many films to show: at >= 270px inner show 2+; each compact row ~66px
  const filmCount = height <= 0 ? 1 : height >= 270 ? Math.max(1, Math.min(4, Math.floor((height - 44) / 66))) : 1;
  const visibleFilms = films.slice(0, filmCount);

  return (
    <Panel ref={ref} style={{ cursor: "pointer" }} onClick={() => router.push("/films")}>
      {/* Header */}
      <div className="hayati-drag-handle" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Tag color={C.textFaint}>Last watched</Tag>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dot size={4} />
          <Tag color={C.textMuted}>
            {!username ? "not configured" : loaded ? "live" : "loading"}
          </Tag>
        </div>
      </div>

      {!username ? (
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>
          configure letterboxd username in settings
        </span>
      ) : !loaded ? (
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>loading...</span>
      ) : !film ? (
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>no films found</span>
      ) : height > 0 && height < 130 ? (
        /* Minimal: title + rating only */
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {film.url ? (
            <a href={film.url} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, textDecoration: "none", lineHeight: 1.4 }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = C.text)}
            >
              {film.title}{film.year ? <span style={{ color: C.textFaint }}> {film.year}</span> : null}
            </a>
          ) : (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, lineHeight: 1.4 }}>
              {film.title}{film.year ? <span style={{ color: C.textFaint }}> {film.year}</span> : null}
            </span>
          )}
          {film.rating !== undefined && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.accent, letterSpacing: "2px" }}>{stars(film.rating)}</span>
          )}
        </div>
      ) : (
        /* Full list: one or more films */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {visibleFilms.map((f, i) => (
            <div key={i}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {/* Poster */}
                <div style={{ width: 36, height: 54, flexShrink: 0, borderRadius: 3, border: `1px solid ${C.border}`, overflow: "hidden", background: C.surfaceHi }}>
                  {f.poster ? (
                    <img src={f.poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, textDecoration: "none", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                      onClick={e => e.stopPropagation()}
                      onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                    >
                      {f.title}{f.year ? <span style={{ color: C.textFaint }}> {f.year}</span> : null}
                    </a>
                  ) : (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.text, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.title}{f.year ? <span style={{ color: C.textFaint }}> {f.year}</span> : null}
                    </span>
                  )}
                  {f.rating !== undefined && (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.accent, letterSpacing: "1.5px" }}>{stars(f.rating)}</span>
                  )}
                  <Tag color={C.textFaint}>{f.watchedDate}</Tag>
                </div>
              </div>
              {i < visibleFilms.length - 1 && <div style={{ height: 1, background: C.border, margin: "8px 0" }} />}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
