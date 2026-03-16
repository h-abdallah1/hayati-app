"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutDashboard, Dumbbell, Moon, Settings } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { FONT_MONO } from "@/lib/constants";

const TABS = [
  { href: "/mobile",          Icon: Target,          label: "Overview" },
  { href: "/mobile/dashboard", Icon: LayoutDashboard, label: "Dash" },
  { href: "/mobile/gym",       Icon: Dumbbell,        label: "Gym" },
  { href: "/mobile/prayer",    Icon: Moon,            label: "Prayer" },
  { href: "/mobile/settings",  Icon: Settings,        label: "Settings" },
];

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const C = useTheme();
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {children}

      {/* Bottom Tab Bar */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingTop: 8,
        zIndex: 100,
      }}>
        {TABS.map(({ href, Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2,
                textDecoration: "none",
                padding: "4px 12px",
                minWidth: 52,
              }}
            >
              <Icon
                size={20}
                color={active ? C.accent : C.textFaint}
                strokeWidth={active ? 2 : 1.5}
              />
              <span style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                color: active ? C.accent : C.textFaint,
                letterSpacing: "0.02em",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
