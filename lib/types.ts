export type Task = { id: number; text: string; done: boolean; p: "high" | "med" | "low" };
export type Book = { id: number; title: string; author: string; progress: number; color: string };
export type ReadingItem = { id: number; title: string; type: "book" | "essay" | "article"; done: boolean; url?: string };
export type CalEvent = { date: number; label: string; color: string; url?: string };

export type LocationCoords = { lat: number; lon: number; tz: string; label: string };
export type NewsFeed = { url: string; label: string };
export type TimeFormat = "12h" | "24h";
export type GlobalSettings = {
  name: string;
  location: LocationCoords;
  timeFormat: TimeFormat;
  letterboxdUsername: string;
};
export type PanelSettings = {
  newsFeeds: NewsFeed[];
  calendarFeeds: string[];
  hiddenPanels: string[];
  pomodoroWork: number;
  pomodoroBreak: number;
};
export type NewsItem = {
  source: string;
  title: string;
  url?: string;
  time: string;
  description?: string;
  author?: string;
  categories?: string[];
  image?: string;
};
export type CalEventFull = { date: string; label: string; color: string; url?: string };

export type Goal = { id: number; title: string; optional?: boolean; status: "todo" | "active" | "done"; description?: string; created: string; year?: number };
export type Note = { id: number; title: string; content: string; updated: string };
export type Transaction = { id: number; amount: number; category: string; description: string; date: string; type: "in" | "out" };

export type FilmEntry = {
  title: string;
  year?: number;
  rating?: number;
  watchedDate: string;
  rewatch: boolean;
  liked: boolean;
  poster?: string;
  url?: string;
};
