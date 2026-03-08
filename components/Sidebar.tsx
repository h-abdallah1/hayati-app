"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { isRouteDisabled, MODULES } from "@/lib/modules";
import { useState } from "react";
import { Home, LayoutDashboard, Target, FileText, Wallet, Dumbbell, Newspaper, Moon, Search, Clapperboard, Globe, Settings, Maximize2 } from "lucide-react";

const NAV = [
  { href: "/",          Icon: Home,            label: "Home"      },
  { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard" },
  { href: "/overview", Icon: Target,          label: "Overview"  },
  { href: "/notes",    Icon: FileText,        label: "Notes"     },
  { href: "/finance",  Icon: Wallet,          label: "Finance"   },
  { href: "/gym",      Icon: Dumbbell,        label: "Gym"       },
  { href: "/news",     Icon: Newspaper,       label: "News"      },
  { href: "/films",    Icon: Clapperboard,    label: "Films"     },
  { href: "/travel",   Icon: Globe,           label: "Travel"    },
  { href: "/prayer",   Icon: Moon,            label: "Prayer"    },
];

export function Sidebar() {
  const C = useTheme();
  const path = usePathname();
  const { global, updateGlobal } = useGlobalSettings();
  const [hovered, setHovered] = useState<string | null>(null);

  const PINNED = new Set(["/", "/dashboard"]);

  const orderedNav = [
    ...NAV.filter(n => PINNED.has(n.href)),
    ...[...NAV.filter(n => !PINNED.has(n.href))].sort((a, b) => {
      const order = global.moduleOrder;
      const ai = order.indexOf(MODULES.find(m => m.route === a.href)?.id ?? "");
      const bi = order.indexOf(MODULES.find(m => m.route === b.href)?.id ?? "");
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    }),
  ];

  const visibleNav = orderedNav.filter(({ href }) =>
    PINNED.has(href) || href === "/overview" ||
    !isRouteDisabled(href, global.disabledModules)
  );

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  return (
    <div style={{
      position: "fixed",
      left: 0, top: 0, bottom: 0,
      width: 56,
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 18,
      gap: 6,
      zIndex: 100,
    }}>
      {/* Logo mark */}
      <div style={{
        fontFamily: "'Scheherazade New',serif",
        fontSize: 20,
        color: C.accent,
        marginBottom: 14,
        lineHeight: 1,
      }}>
        ح
      </div>

      {visibleNav.map(({ href, Icon, label }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        const hover = hovered === href;
        return (
          <Link
            key={href}
            href={href}
            title={label}
            onMouseEnter={() => setHovered(href)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 36,
              borderRadius: 7,
              background: hover ? C.surfaceHi : "transparent",
              border: "1px solid transparent",
              color: active ? C.accent : hover ? C.textMuted : C.textFaint,
              textDecoration: "none",
            }}
          >
            <Icon size={15} strokeWidth={active ? 2.2 : 1.7} />
          </Link>
        );
      })}

      {/* Bottom buttons */}
      <div style={{ marginTop: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <button
          onClick={() => updateGlobal({ fullscreen: true })}
          title="Fullscreen (F)"
          onMouseEnter={() => setHovered("fullscreen")}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 38, height: 36, borderRadius: 7,
            background: hovered === "fullscreen" ? C.surfaceHi : "transparent",
            border: "1px solid transparent",
            color: hovered === "fullscreen" ? C.textMuted : C.textFaint,
            cursor: "pointer",
          }}
        >
          <Maximize2 size={15} strokeWidth={1.7} />
        </button>
        <button
          onClick={openSearch}
          title="Search (⌘K)"
          onMouseEnter={() => setHovered("search")}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 38, height: 36, borderRadius: 7,
            background: hovered === "search" ? C.surfaceHi : "transparent",
            border: "1px solid transparent",
            color: hovered === "search" ? C.textMuted : C.textFaint,
            cursor: "pointer",
          }}
        >
          <Search size={15} strokeWidth={1.7} />
        </button>
        <Link
          href="/settings"
          title="Settings"
          onMouseEnter={() => setHovered("settings")}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 38, height: 36, borderRadius: 7,
            background: hovered === "settings" ? C.surfaceHi : "transparent",
            border: "1px solid transparent",
            color: path === "/settings" ? C.accent : hovered === "settings" ? C.textMuted : C.textFaint,
            textDecoration: "none",
          }}
        >
          <Settings size={15} strokeWidth={path === "/settings" ? 2.2 : 1.7} />
        </Link>
      </div>
    </div>
  );
}
