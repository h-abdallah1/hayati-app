export type Task = { id: number; text: string; done: boolean; p: "high" | "med" | "low" };
export type Book = { id: number; title: string; author: string; progress: number; color: string };
export type ReadingItem = { id: number; title: string; type: "book" | "essay" | "article"; done: boolean; url?: string };
export type CalEvent = { date: number; label: string; color: string; url?: string };

export type LocationCoords = { lat: number; lon: number; tz: string; label: string };
export type NewsFeed = { url: string; label: string };
export type TimeFormat = "12h" | "24h";
export type MapProjection = "equirectangular" | "naturalEarth" | "mercator" | "robinson" | "winkel3" | "mollweide" | "patterson";
export type PrayerMethod = "Dubai" | "MuslimWorldLeague" | "NorthAmerica" | "Egyptian" | "Karachi" | "Kuwait" | "Qatar" | "Singapore" | "Turkey" | "MoonsightingCommittee";
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GlobalSettings = {
  name: string;
  location: LocationCoords;
  timeFormat: TimeFormat;
  letterboxdUsername: string;
  obsidianVaultPath: string;
  travelProjection: MapProjection;
  prayerMethod: PrayerMethod;
  disabledModules: string[];
  moduleOrder: string[];
  showTicker: boolean;
  githubUsername: string;
  githubToken: string;
  fullscreen: boolean;
  ollamaUrl: string;
  ollamaModel: string;
  accentTheme: string;
};
export type PanelSettings = {
  newsFeeds: NewsFeed[];
  calendarFeeds: string[];
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

export type Goal = { id: number; title: string; optional?: boolean; status: "todo" | "active" | "done"; description?: string; created: string; year?: number; completedAt?: string };
export type Note = { id: number; title: string; content: string; updated: string };

export type FilmEntry = {
  title: string;
  year?: number;
  rating?: number;
  watchedDate: string;
  rewatch: boolean;
  liked: boolean;
  poster?: string;
  url?: string;
  review?: string;
};

export type GithubDay = {
  date: string;  // YYYY-MM-DD
  count: number; // total contributions that day
};

export type ReadingEntry = {
  title: string;
  author?: string;
  finishedDate: string; // YYYY-MM-DD
  url?: string;
  cover?: string; // Open Library cover URL
};

export type BookStatus = "notStarted" | "reading" | "read";

export type GameStatus = "backlog" | "playing" | "completed" | "dropped";

export type GamePlatform =
  | "Nintendo Switch" | "PlayStation 5" | "PlayStation 4"
  | "Steam Deck" | "PC" | "Xbox Series X/S" | "Xbox One"
  | "iOS" | "Android" | "Other";

export type GameEntry = {
  id: string;
  title: string;
  platform: GamePlatform;
  status: GameStatus;
  cover?: string;
  addedAt: string;       // ISO datetime
  finishedDate?: string; // YYYY-MM-DD, set when status → "completed"
  rating?: number;
  url?: string;
};

export type BookEntry = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  cover?: string;
  addedAt: string; // ISO date string
  finishedDate?: string; // YYYY-MM-DD, set when status → "read"
  url?: string;
};
