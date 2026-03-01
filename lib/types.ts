export type Task = { id: number; text: string; done: boolean; p: "high" | "med" | "low" };
export type Book = { id: number; title: string; author: string; progress: number; color: string };
export type ReadingItem = { id: number; title: string; type: "book" | "essay" | "article"; done: boolean };
export type CalEvent = { date: number; label: string; color: string };
