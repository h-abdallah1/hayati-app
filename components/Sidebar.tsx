"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
import { LayoutDashboard, Target, FileText, Wallet } from "lucide-react";

const NAV = [
  { href: "/",        Icon: LayoutDashboard, label: "Dashboard" },
  { href: "/goals",   Icon: Target,          label: "Goals"     },
  { href: "/notes",   Icon: FileText,        label: "Notes"     },
  { href: "/finance", Icon: Wallet,          label: "Finance"   },
];

export function Sidebar() {
  const C = useTheme();
  const path = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);

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

      {NAV.map(({ href, Icon, label }) => {
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
              background: active ? C.accentDim : hover ? C.surfaceHi : "transparent",
              border: `1px solid ${active ? C.accentMid : "transparent"}`,
              color: active ? C.accent : hover ? C.textMuted : C.textFaint,
              textDecoration: "none",
            }}
          >
            <Icon size={15} strokeWidth={active ? 2.2 : 1.7} />
          </Link>
        );
      })}
    </div>
  );
}
