import type { Goal } from "@/lib/types";

export type Status = Goal["status"];

export const STATUS_ICON: Record<Status, string>  = { todo: "○", active: "◑", done: "●" };
export const STATUS_CYCLE: Record<Status, Status> = { todo: "active", active: "done", done: "todo" };

export const goalYear = (g: Goal) => g.year ?? new Date(g.created).getFullYear();

const INITIAL: Goal[] = [
  { id: 1, title: "Read 20 books this year", status: "active", description: "Focus on non-fiction and Islamic literature", created: new Date().toISOString() },
  { id: 2, title: "Daily Arabic practice",   status: "todo",   created: new Date().toISOString() },
  { id: 3, title: "Finish CSS course",       status: "done",   created: new Date().toISOString() },
];

export const SEED_2024: Goal[] = [
  { id: 20240001, title: "Finish 2024 Curriculum",                                 status: "todo", year: 2024, description: "did not do this as I have deviated from that path",           created: "2024-01-01T00:00:00.000Z" },
  { id: 20240002, title: "Get started on personal art projects — aim for 10",      status: "todo", year: 2024, description: "did not do this but definitely getting there",                created: "2024-01-01T00:00:00.000Z" },
  { id: 20240003, title: "Save 70,000 dhs in Sarwa and/or other investments",      status: "todo", year: 2024, description: "Saved half of that, I'll take it",                           created: "2024-01-01T00:00:00.000Z" },
  { id: 20240004, title: "Get a visa and set the groundwork for relocating abroad", status: "todo", year: 2024, description: "didn't but I tried my best (UK, Canada, or other)",          created: "2024-01-01T00:00:00.000Z" },
  { id: 20240005, title: "Finish 2 sketchbooks (or 200 sketches)",                 status: "done", year: 2024, description: "didn't finish 2 sketchbooks but did around 150+ sketches",   created: "2024-01-01T00:00:00.000Z" },
  { id: 20240006, title: "Read 10 books",                                           status: "done", year: 2024,                                                                             created: "2024-01-01T00:00:00.000Z" },
  { id: 20240007, title: "Do LASIK",                                                status: "done", year: 2024,                                                                             created: "2024-01-01T00:00:00.000Z" },
  { id: 20240008, title: "Go debt free",                                            status: "done", year: 2024,                                                                             created: "2024-01-01T00:00:00.000Z" },
];

export const SEED_2025: Goal[] = [
  { id: 20250001, title: "Save 100k DHS in Sarwa",                                                    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250002, title: "Get good enough to play a tough song on drums",                              status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250003, title: "Finish Bridgman Complete Guide to Drawing from Life",                        status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250004, title: "Finish 3 other art books",                                                   status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250005, title: "Spend another year drawing consistently",                                    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250006, title: "Learn to draw from imagination",                                             status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250007, title: "Draw 300+ pages of sketches/drawings",                                       status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250008, title: "Release a game with Hod",                                                    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250009, title: "Get a sick ass tattoo on either my right shoulder or my left forearm",       status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250010, title: "Finish the old drawing curriculum — or finish Drawabox", optional: true,    status: "todo", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250011, title: "Travel to the UK and Australia",                                             status: "done", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250012, title: "Get jacked — hit 92kg and finish the lean bulk",                             status: "done", year: 2025, created: "2025-01-01T00:00:00.000Z" },
  { id: 20250013, title: "Apply for an Australian PR and visa",                                        status: "done", year: 2025, created: "2025-01-01T00:00:00.000Z" },
];

export const SEED_2026: Goal[] = [
  { id: 20260001, title: "Create a website for my photography portfolio", status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260002, title: "Finish one junk journal",                       status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260003, title: "Do 1 push up a day everyday",                   status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260004, title: "Save 150k",                                     status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260005, title: "Make less impulse purchases",                   status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260006, title: "Finish 2026 with 0 debt",                       status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260007, title: "Order takeout less",                            status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260008, title: "Do 200 gym sessions",                           status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260009, title: "Minimize soda intake",                          status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260010, title: "Watch 30 movies",                               status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260011, title: "Draw for 200 hrs or do 200 sketches",           status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260012, title: "Read 10 books, learn 3 topics",                 status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260013, title: "Release a game on Steam",                       status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260014, title: "Write a song with Tala",                        status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260015, title: "Pray more",                                     status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260016, title: "Journal more",                                  status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260017, title: "Get engaged",                                   status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
  { id: 20260018, title: "Learn to live life more and to let go more often — trust the process", status: "todo", year: 2026, created: "2026-01-01T00:00:00.000Z" },
];

const ALL_SEEDS = [...SEED_2024, ...SEED_2025, ...SEED_2026];

const SEED_PATCHES: Record<number, Partial<Goal>> = {
  20250010: { title: "Finish the old drawing curriculum — or finish Drawabox", optional: true },
};

export function load(): Goal[] {
  try {
    const s = localStorage.getItem("hayati-goals");
    const existing: Goal[] = s ? JSON.parse(s) : INITIAL;
    const existingIds = new Set(existing.map(g => g.id));
    const toAdd = ALL_SEEDS.filter(g => !existingIds.has(g.id));
    const patched = existing.map(g => SEED_PATCHES[g.id] ? { ...g, ...SEED_PATCHES[g.id] } : g);
    const merged = [...patched, ...toAdd];
    if (toAdd.length || patched.some((g, i) => g !== existing[i])) {
      try { localStorage.setItem("hayati-goals", JSON.stringify(merged)); } catch {}
    }
    return merged;
  } catch {}
  return [...INITIAL, ...ALL_SEEDS];
}

export function persist(goals: Goal[]) {
  try { localStorage.setItem("hayati-goals", JSON.stringify(goals)); } catch {}
}
