"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useLetterboxd } from "@/lib/hooks";
import { Panel, Tag, Dot } from "@/components/ui";

function stars(r: number): string {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

export function FilmsPanel() {
  const C = useTheme();
  const router = useRouter();
  const { global } = useGlobalSettings();
  const username = global.letterboxdUsername ?? "";
  const { films, loaded } = useLetterboxd(username);

  const film = films[0] ?? null;

  return (
    <Panel style={{ cursor: "pointer" }} onClick={() => router.push("/films")}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
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
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Thumbnail */}
          <div style={{
            width: 48, height: 72, flexShrink: 0,
            borderRadius: 4, border: `1px solid ${C.border}`,
            overflow: "hidden", background: C.surfaceHi,
          }}>
            {film.poster ? (
              <img
                src={film.poster}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : null}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
            {film.url ? (
              <a
                href={film.url}
                target="_blank"
                rel="noopener noreferrer"
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
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.accent, letterSpacing: "2px" }}>
                {stars(film.rating)}
              </span>
            )}
            <Tag color={C.textFaint}>{film.watchedDate}</Tag>
          </div>
        </div>
      )}
    </Panel>
  );
}
