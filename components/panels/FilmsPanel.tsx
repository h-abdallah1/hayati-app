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
  const smFilm = height > 0 && height < 200;
  // How many films to show: at >= 270px inner show 2+; each compact row ~66px
  const filmCount = height <= 0 ? 1 : height >= 270 ? Math.max(1, Math.min(4, Math.floor((height - 44) / 66))) : 1;
  const visibleFilms = films.slice(0, filmCount);

  const posterStyle = (w: number, h: number, r: number): React.CSSProperties => ({
    width: w, height: h, flexShrink: 0, borderRadius: r,
    background: C.surfaceHi, border: `1px solid ${C.border}`,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
  });

  return (
    <Panel ref={ref} style={{ cursor: "pointer", padding: smFilm ? 14 : 20 }} onClick={() => router.push("/films")}>
      {/* Header */}
      <div className="hayati-drag-handle" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: smFilm ? 8 : 14 }}>
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
      ) : height > 0 && height < 200 ? (
        /* Compact: poster + info side by side, title wraps */
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={posterStyle(56, 78, 6)}>
            {film.poster && (
              <img src={film.poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>
              {film.title}
            </div>
            {film.year && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{film.year}</div>}
            {film.rating !== undefined && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.accent, letterSpacing: "1.5px" }}>{stars(film.rating)}</span>
            )}
          </div>
        </div>
      ) : (
        /* Full list: one or more films */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {visibleFilms.map((f, i) => (
            <div key={i}>
              <div style={{ display: "flex", gap: filmCount > 1 ? 10 : 14, alignItems: "flex-start" }}>
                {/* Poster */}
                <div style={posterStyle(filmCount > 1 ? 36 : 56, filmCount > 1 ? 54 : 78, filmCount > 1 ? 4 : 6)}>
                  {f.poster ? (
                    <img src={f.poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: filmCount > 1 ? 14 : 18, color: C.border }}>▣</span>
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", height: filmCount > 1 ? 54 : 78 }}>
                  <div>
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: "'Syne',sans-serif", fontSize: filmCount > 1 ? 12 : 13, fontWeight: 700, color: C.text, textDecoration: "none", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", marginBottom: 4 }}
                        onClick={e => e.stopPropagation()}
                        onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                        onMouseLeave={e => (e.currentTarget.style.color = C.text)}
                      >
                        {f.title}
                      </a>
                    ) : (
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: filmCount > 1 ? 12 : 13, fontWeight: 700, color: C.text, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                        {f.title}
                      </div>
                    )}
                    {f.year && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>{f.year}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {f.rating !== undefined
                      ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: C.accent, letterSpacing: "1.5px" }}>{stars(f.rating)}</span>
                      : <span />
                    }
                    <Tag color={C.textFaint}>{f.watchedDate}</Tag>
                  </div>
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
