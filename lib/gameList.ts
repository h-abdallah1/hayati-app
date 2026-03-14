import type { GameEntry } from "./types";

const KEY = "hayati-game-list";

export function loadGames(): GameEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameEntry[];
  } catch { return []; }
}

export function persistGames(games: GameEntry[]): void {
  const json = JSON.stringify(games);
  try { localStorage.setItem(KEY, json); } catch {}
  fetch("/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: KEY, value: json }),
  }).catch(() => {});
}
