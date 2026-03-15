"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { usePanelSize } from "@/lib/hooks";
import { Panel, Tag } from "@/components/ui";
import type { GameEntry, GamePlatform } from "@/lib/types";
import { loadGames } from "@/lib/gameList";
import { SiPlaystation, SiSteam, SiSteamdeck, SiApple, SiAndroid } from "react-icons/si";
import { Monitor, Gamepad2, Gamepad } from "lucide-react";

const PLATFORM_META: Record<GamePlatform, { icon: React.ReactNode; color: string; short: string }> = {
  "Nintendo Switch":  { icon: <Gamepad       size={10} />, color: "#e4000f", short: "NSW"  },
  "PlayStation 5":    { icon: <SiPlaystation size={10} />, color: "#003791", short: "PS5"  },
  "PlayStation 4":    { icon: <SiPlaystation size={10} />, color: "#003791", short: "PS4"  },
  "Steam Deck":       { icon: <SiSteamdeck   size={10} />, color: "#6c8ebf", short: "SD"   },
  "PC":               { icon: <SiSteam       size={10} />, color: "#7289da", short: "PC"   },
  "Xbox Series X/S":  { icon: <Gamepad2      size={10} />, color: "#107c10", short: "XSX"  },
  "Xbox One":         { icon: <Gamepad2      size={10} />, color: "#107c10", short: "XB1"  },
  "iOS":              { icon: <SiApple       size={10} />, color: "#888888", short: "iOS"  },
  "Android":          { icon: <SiAndroid     size={10} />, color: "#3ddc84", short: "AND"  },
  "Other":            { icon: <Monitor       size={10} />, color: "#888888", short: "???"  },
};

export function GamingPanel() {
  const C = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);

  const [games, setGames] = useState<GameEntry[]>([]);

  useEffect(() => { setGames(loadGames()); }, []);

  const current = [...games].sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0] ?? null;
  const smRead  = height > 0 && height < 200;

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
          <div style={{ width: 56, height: smRead ? 68 : 78, borderRadius: smRead ? 4 : 6, flexShrink: 0, background: C.surfaceHi, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current.cover
              ? <img src={current.cover} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: smRead ? 14 : 18, color: C.border }}>⬛</span>
            }
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: smRead ? 12 : 13, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>{current.title}</div>
            {(() => { const m = PLATFORM_META[current.platform] ?? PLATFORM_META["Other"]; return (
              <span title={current.platform} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: m.color, opacity: 0.85, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600, lineHeight: 1 }}>{m.icon}{m.short}</span>
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
