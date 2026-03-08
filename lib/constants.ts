import {
  Home, LayoutDashboard, Target, FileText, Wallet,
  Dumbbell, Newspaper, Clapperboard, Globe, Moon,
  type LucideIcon,
} from "lucide-react";

// ── Default coordinates ─────────────────────────────────────────────────────

export type Coords = { lat: number; lon: number; tz: string };

export const DEFAULT_COORDS: Coords = {
  lat: 25.3573,
  lon: 55.4033,
  tz: "Asia/Dubai",
};

// ── Font families ───────────────────────────────────────────────────────────

export const FONT_MONO = "var(--font-mono), 'JetBrains Mono', monospace";
export const FONT_HEADING = "var(--font-syne), 'Syne', sans-serif";
export const FONT_ARABIC = "var(--font-arabic), 'Scheherazade New', serif";

// ── Navigation ──────────────────────────────────────────────────────────────

export type NavItem = {
  href: string;
  Icon: LucideIcon;
  label: string;
  desc?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/",          Icon: Home,            label: "Home",      desc: "Landing"            },
  { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard", desc: "Panels & widgets"   },
  { href: "/overview",  Icon: Target,          label: "Overview",  desc: "Goals & activity"   },
  { href: "/notes",     Icon: FileText,        label: "Notes",     desc: "Obsidian vault"     },
  { href: "/finance",   Icon: Wallet,          label: "Finance",   desc: "Transactions"       },
  { href: "/gym",       Icon: Dumbbell,        label: "Gym",       desc: "Workout analytics"  },
  { href: "/news",      Icon: Newspaper,       label: "News",      desc: "RSS feeds"          },
  { href: "/films",     Icon: Clapperboard,    label: "Films",     desc: "Letterboxd log"     },
  { href: "/travel",    Icon: Globe,           label: "Travel",    desc: "World map"          },
  { href: "/prayer",    Icon: Moon,            label: "Prayer",    desc: "Prayer times"       },
];

// ── Greeting ────────────────────────────────────────────────────────────────

export function getGreeting(date: Date): string {
  const h = date.getHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}
