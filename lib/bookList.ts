import type { BookEntry } from "./types";

const KEY = "hayati-book-list";

export function loadBooks(): BookEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BookEntry[];
  } catch { return []; }
}

export function persistBooks(books: BookEntry[]): void {
  const json = JSON.stringify(books);
  try { localStorage.setItem(KEY, json); } catch {}
  fetch("/api/store", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: KEY, value: json }),
  }).catch(() => {});
}
