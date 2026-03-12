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
  try { localStorage.setItem(KEY, JSON.stringify(books)); } catch {}
}
