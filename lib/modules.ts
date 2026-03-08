import { Dumbbell, Wallet, Clapperboard, Newspaper, Moon, Calendar, BookOpen, FileText, Globe, Target, GitMerge, type LucideIcon } from "lucide-react";

export type ModuleDef = {
  id: string;
  label: string;
  description: string;
  panels: string[];
  route?: string;
  icon: LucideIcon;
};

export const MODULES: ModuleDef[] = [
  { id: "gym",      label: "Gym",      description: "Workout tracker and exercise analytics",  panels: ["gym"],               route: "/gym",     icon: Dumbbell     },
  { id: "finance",  label: "Finance",  description: "Budget, transactions and savings tracker", panels: ["finance","savings"], route: "/finance", icon: Wallet       },
  { id: "films",    label: "Films",    description: "Letterboxd watch history and ratings",    panels: ["films"],             route: "/films",   icon: Clapperboard },
  { id: "news",     label: "News",     description: "RSS news feeds from custom sources",      panels: ["news"],              route: "/news",    icon: Newspaper    },
  { id: "prayer",   label: "Prayer",   description: "Daily prayer times and Quran verse",      panels: ["prayer","quran"],    route: "/prayer",  icon: Moon         },
  { id: "calendar", label: "Calendar", description: "Events from iCal and CalDAV feeds",       panels: ["calendar"],                             icon: Calendar     },
  { id: "reading",  label: "Reading",  description: "Book and reading list tracker",            panels: ["reading"],                              icon: BookOpen     },
  { id: "overview", label: "Overview", description: "Year progress, activity counts and goals", panels: ["overview"],          route: "/overview", icon: Target     },
  { id: "notes",    label: "Notes",    description: "Quick notes and Obsidian vault sync",      panels: [],                    route: "/notes",   icon: FileText     },
  { id: "travel",   label: "Travel",   description: "World map and visited countries tracker",  panels: [],                    route: "/travel",  icon: Globe        },
  { id: "github",   label: "GitHub",   description: "GitHub contribution heatmap and streaks",  panels: ["github"],                               icon: GitMerge     },
];

export function getHiddenPanels(disabledModules: string[]): string[] {
  return MODULES
    .filter(m => disabledModules.includes(m.id))
    .flatMap(m => m.panels);
}

export function isRouteDisabled(route: string, disabledModules: string[]): boolean {
  return MODULES.some(m => m.route === route && disabledModules.includes(m.id));
}
