import type { ReadingEntry } from "./types";
import { loadBooks } from "./bookList";

const KEY = "hayati-books";

export function load(): ReadingEntry[] {
  return loadBooks()
    .filter(b => b.finishedDate)
    .map(b => ({
      title: b.title,
      author: b.author || undefined,
      finishedDate: b.finishedDate!,
      url: b.url,
      cover: b.cover,
    }));
}

/** @deprecated No longer called by reading page; kept for legacy compatibility */
export function persist(books: ReadingEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(books)); } catch {}
}
