import type { ReadingEntry } from "./types";

const KEY = "hayati-books";

export function load(): ReadingEntry[] {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as ReadingEntry[]) : [];
  } catch { return []; }
}

export function persist(books: ReadingEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(books)); } catch {}
}
