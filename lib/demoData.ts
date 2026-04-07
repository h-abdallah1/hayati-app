// Demo mode — fake data used when global.demoMode is true

import type { FilmEntry, GithubDay, NewsItem, CalEventFull, Goal, GameEntry, BookEntry, ReadingEntry, GlobalSettings } from "@/lib/types";
import type { HevyWorkoutFull } from "@/app/api/hevy/workouts/route";
import type { ObsidianFile } from "@/app/api/obsidian/files/route";

// ── Settings patch ────────────────────────────────────────────────────────────

export const DEMO_SETTINGS_PATCH: Partial<GlobalSettings> = {
  name: "Alex Chen",
  location: { lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo", label: "Tokyo, Japan" },
  letterboxdUsername: "",
  githubUsername: "",
  githubToken: "",
  obsidianVaultPath: "",
};

// ── Weather ──────────────────────────────────────────────────────────────────

export const DEMO_WEATHER = {
  temp: "22",
  condition: "Partly Cloudy",
  sunrise: "05:41",
  sunset: "18:14",
  feelsLike: "21",
  humidity: "62",
  wind: "11",
  uvIndex: "4",
  hourly: [
    { time: "08:00", temp: 17, condition: "Clear" },
    { time: "10:00", temp: 19, condition: "Partly Cloudy" },
    { time: "12:00", temp: 22, condition: "Partly Cloudy" },
    { time: "14:00", temp: 23, condition: "Partly Cloudy" },
    { time: "16:00", temp: 21, condition: "Cloudy" },
    { time: "18:00", temp: 18, condition: "Cloudy" },
    { time: "20:00", temp: 16, condition: "Clear" },
  ],
  loaded: true,
};

// ── Films ─────────────────────────────────────────────────────────────────────

export const DEMO_FILMS: FilmEntry[] = [
  { title: "Dune: Part Two",          year: 2024, rating: 4.5, watchedDate: "2026-03-28", rewatch: false, liked: true  },
  { title: "Oppenheimer",             year: 2023, rating: 5,   watchedDate: "2026-03-14", rewatch: false, liked: true  },
  { title: "Past Lives",              year: 2023, rating: 4.5, watchedDate: "2026-02-22", rewatch: false, liked: true  },
  { title: "The Holdovers",           year: 2023, rating: 4,   watchedDate: "2026-02-08", rewatch: false, liked: false },
  { title: "Poor Things",             year: 2023, rating: 3.5, watchedDate: "2026-01-30", rewatch: false, liked: false },
  { title: "Anatomy of a Fall",       year: 2023, rating: 4,   watchedDate: "2026-01-18", rewatch: false, liked: true  },
  { title: "Killers of the Flower Moon", year: 2023, rating: 4.5, watchedDate: "2026-01-05", rewatch: false, liked: true },
  { title: "Interstellar",            year: 2014, rating: 5,   watchedDate: "2025-12-28", rewatch: true,  liked: true  },
  { title: "The Zone of Interest",    year: 2023, rating: 4,   watchedDate: "2025-12-14", rewatch: false, liked: false },
  { title: "Aftersun",                year: 2022, rating: 5,   watchedDate: "2025-11-30", rewatch: true,  liked: true  },
  { title: "All of Us Strangers",     year: 2023, rating: 4.5, watchedDate: "2025-11-12", rewatch: false, liked: true  },
  { title: "Challengers",             year: 2024, rating: 4,   watchedDate: "2025-10-25", rewatch: false, liked: true  },
  { title: "Alien: Romulus",          year: 2024, rating: 3,   watchedDate: "2025-10-08", rewatch: false, liked: false },
  { title: "The Substance",           year: 2024, rating: 3.5, watchedDate: "2025-09-19", rewatch: false, liked: false },
  { title: "Longlegs",                year: 2024, rating: 2.5, watchedDate: "2025-09-04", rewatch: false, liked: false },
];

// ── GitHub ────────────────────────────────────────────────────────────────────

function githubDays(year: number): GithubDay[] {
  const days: GithubDay[] = [];
  const start = new Date(`${year}-01-01`);
  const end   = new Date(`${year}-04-09`);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends mostly
    if (Math.random() > 0.72) continue;   // ~28% skip
    const count = 1 + Math.floor(Math.random() * 7);
    days.push({ date: d.toISOString().split("T")[0], count });
  }
  return days;
}

// Pre-generate for current year so it's stable within a session
export const DEMO_GITHUB: GithubDay[] = githubDays(new Date().getFullYear());
export const DEMO_GITHUB_TOTAL = DEMO_GITHUB.reduce((s, d) => s + d.count, 0);

// ── News ──────────────────────────────────────────────────────────────────────

export const DEMO_NEWS: NewsItem[] = [
  { source: "Tech Weekly",    title: "OpenAI releases new model with improved reasoning capabilities", time: new Date(Date.now() - 1 * 3600000).toISOString(),   description: "The latest update brings significant improvements to code generation and logical reasoning tasks." },
  { source: "The Financial",  title: "Global markets steady as central banks hold interest rates", time: new Date(Date.now() - 3 * 3600000).toISOString(),   description: "Investors cautiously optimistic as Fed signals no imminent rate changes." },
  { source: "Science Daily",  title: "Researchers achieve breakthrough in solid-state battery efficiency", time: new Date(Date.now() - 5 * 3600000).toISOString(), description: "New cathode material could extend EV range by 40% while cutting charging time in half." },
  { source: "World Report",   title: "UN climate summit reaches landmark carbon reduction agreement", time: new Date(Date.now() - 8 * 3600000).toISOString(),  description: "Over 140 nations sign pledge to cut emissions 45% by 2035." },
  { source: "Tech Weekly",    title: "Apple announces spatial computing developer platform at WWDC", time: new Date(Date.now() - 12 * 3600000).toISOString(), description: "New APIs open Vision Pro capabilities to third-party developers." },
  { source: "The Financial",  title: "Semiconductor stocks surge on strong quarterly earnings", time: new Date(Date.now() - 18 * 3600000).toISOString(), description: "NVIDIA, TSMC, and ASML report record revenues driven by AI chip demand." },
  { source: "Design Matters", title: "How constraint-driven design is shaping the next generation of apps", time: new Date(Date.now() - 24 * 3600000).toISOString(), description: "A look at studios embracing minimalism not as aesthetic but as philosophy." },
  { source: "World Report",   title: "Japan sets new record for renewable energy generation in Q1", time: new Date(Date.now() - 30 * 3600000).toISOString(), description: "Solar and wind account for 38% of total electricity production." },
  { source: "Science Daily",  title: "James Webb telescope captures clearest image of a young solar system", time: new Date(Date.now() - 36 * 3600000).toISOString(), description: "The protoplanetary disc around star HD 163296 reveals planet formation in progress." },
  { source: "Tech Weekly",    title: "Rust surpasses Go in GitHub repository count for backend services", time: new Date(Date.now() - 42 * 3600000).toISOString(), description: "Developer survey shows memory safety concerns driving language adoption." },
];

// ── Calendar ──────────────────────────────────────────────────────────────────

export const DEMO_CALENDAR: CalEventFull[] = [
  { date: "2026-04-10", label: "Team standup",              color: "#4a9eff" },
  { date: "2026-04-12", label: "Design review — v2.4",      color: "#a78bfa" },
  { date: "2026-04-15", label: "Dentist appointment",       color: "#f5a623" },
  { date: "2026-04-18", label: "Weekend hiking trip",       color: "#22c55e" },
  { date: "2026-04-22", label: "Quarterly planning sync",   color: "#4a9eff" },
];

// ── Gym ───────────────────────────────────────────────────────────────────────

export const DEMO_GYM_LIFETIME = {
  totalSessions: 312,
  totalHrs: 468,
  longestStreak: 18,
  firstDate: "2021-03-14",
};

type Set = { index: number; type: string; weight_kg: number | null; reps: number | null; duration_seconds: number | null };
const s = (i: number, kg: number | null, reps: number | null): Set => ({ index: i, type: "normal", weight_kg: kg, reps, duration_seconds: null });

const PUSH_EXERCISES = [
  { index: 0, title: "Bench Press",            sets: [s(0,80,8), s(1,82.5,7), s(2,82.5,6), s(3,85,5)] },
  { index: 1, title: "Overhead Press",         sets: [s(0,52.5,8), s(1,55,7), s(2,55,6)] },
  { index: 2, title: "Incline Dumbbell Press", sets: [s(0,32,10), s(1,34,9), s(2,34,8)] },
  { index: 3, title: "Tricep Pushdown",        sets: [s(0,30,12), s(1,32.5,11), s(2,32.5,10)] },
  { index: 4, title: "Lateral Raise",          sets: [s(0,14,15), s(1,14,13), s(2,16,12)] },
];
const PULL_EXERCISES = [
  { index: 0, title: "Deadlift",               sets: [s(0,120,5), s(1,125,5), s(2,127.5,4), s(3,130,3)] },
  { index: 1, title: "Barbell Row",            sets: [s(0,70,8), s(1,72.5,8), s(2,72.5,7)] },
  { index: 2, title: "Pull-Up",                sets: [s(0,null,8), s(1,null,7), s(2,null,6)] },
  { index: 3, title: "Face Pull",              sets: [s(0,22.5,15), s(1,25,13), s(2,25,12)] },
  { index: 4, title: "Hammer Curl",            sets: [s(0,18,12), s(1,18,11), s(2,20,9)] },
];
const LEGS_EXERCISES = [
  { index: 0, title: "Back Squat",             sets: [s(0,95,6), s(1,97.5,6), s(2,100,5), s(3,100,4)] },
  { index: 1, title: "Romanian Deadlift",      sets: [s(0,80,10), s(1,82.5,9), s(2,82.5,8)] },
  { index: 2, title: "Leg Press",              sets: [s(0,160,12), s(1,170,11), s(2,170,10)] },
  { index: 3, title: "Walking Lunge",          sets: [s(0,null,20), s(1,null,20)] },
  { index: 4, title: "Calf Raise",             sets: [s(0,null,20), s(1,null,18), s(2,null,18)] },
];

const WORKOUT_DATES_2026 = [
  "2026-01-05","2026-01-07","2026-01-09","2026-01-12","2026-01-14","2026-01-16",
  "2026-01-19","2026-01-21","2026-01-23","2026-01-26","2026-01-28","2026-01-30",
  "2026-02-02","2026-02-04","2026-02-06","2026-02-09","2026-02-11","2026-02-13",
  "2026-02-16","2026-02-18","2026-02-20","2026-02-23","2026-02-25","2026-02-27",
  "2026-03-02","2026-03-04","2026-03-06","2026-03-09","2026-03-11","2026-03-13",
  "2026-03-16","2026-03-18","2026-03-20","2026-03-23","2026-03-25","2026-03-27",
  "2026-03-30","2026-04-01","2026-04-03","2026-04-06","2026-04-08",
];

const SPLITS = ["Push", "Pull", "Legs"] as const;
const SPLIT_EXERCISES = { Push: PUSH_EXERCISES, Pull: PULL_EXERCISES, Legs: LEGS_EXERCISES };
const DURATIONS = { Push: 58, Pull: 62, Legs: 65 };

export const DEMO_GYM_WORKOUTS: HevyWorkoutFull[] = WORKOUT_DATES_2026.map((date, i) => {
  const split = SPLITS[i % 3];
  return {
    id: `demo-${i}`,
    title: `${split} Day`,
    date,
    duration: DURATIONS[split],
    exercises: SPLIT_EXERCISES[split],
  };
});

// ── Books ─────────────────────────────────────────────────────────────────────

export const DEMO_BOOKS: BookEntry[] = [
  { id: "b1", title: "Atomic Habits",                author: "James Clear",         finishedDate: "2026-03-20", addedAt: "2026-02-01" },
  { id: "b2", title: "The Pragmatic Programmer",     author: "David Thomas",         finishedDate: "2026-02-14", addedAt: "2026-01-10" },
  { id: "b3", title: "Dune",                         author: "Frank Herbert",         finishedDate: "2026-01-28", addedAt: "2025-12-20" },
  { id: "b4", title: "A Philosophy of Software Design", author: "John Ousterhout",   finishedDate: "2025-12-05", addedAt: "2025-11-15" },
  { id: "b5", title: "The Name of the Wind",         author: "Patrick Rothfuss",     finishedDate: "2025-10-18", addedAt: "2025-09-01" },
  { id: "b6", title: "Thinking, Fast and Slow",      author: "Daniel Kahneman",      finishedDate: "2025-08-30", addedAt: "2025-07-12" },
  { id: "b7", title: "Blood Meridian",               author: "Cormac McCarthy",       finishedDate: "2025-06-22", addedAt: "2025-05-01" },
];

// ── Reading entries (for overview page — ReadingEntry type) ──────────────────

export const DEMO_READING_ENTRIES: ReadingEntry[] = DEMO_BOOKS
  .filter(b => !!b.finishedDate)
  .map(b => ({ title: b.title, author: b.author, finishedDate: b.finishedDate!, url: b.url, cover: b.cover }));

// ── Games ─────────────────────────────────────────────────────────────────────

export const DEMO_GAMES: GameEntry[] = [
  { id: "g1", title: "Elden Ring",        platform: "PlayStation 5",  finishedDate: "2026-03-10", addedAt: "2026-01-15", rating: 5   },
  { id: "g2", title: "Hades II",          platform: "PC",             finishedDate: "2026-01-22", addedAt: "2025-12-01", rating: 4.5 },
  { id: "g3", title: "Balatro",           platform: "Steam Deck",     finishedDate: "2025-11-08", addedAt: "2025-10-01", rating: 4.5 },
  { id: "g4", title: "Hollow Knight",     platform: "Nintendo Switch", finishedDate: "2025-08-14", addedAt: "2025-07-01", rating: 5   },
  { id: "g5", title: "Cyberpunk 2077",    platform: "PlayStation 5",  finishedDate: "2025-05-30", addedAt: "2025-04-10", rating: 4   },
];

// ── Goals ─────────────────────────────────────────────────────────────────────

const y = new Date().getFullYear();
export const DEMO_GOALS: Goal[] = [
  { id: 1, title: "Read 12 books",                  status: "active", created: `${y}-01-01`, year: y },
  { id: 2, title: "Ship a side project",            status: "active", created: `${y}-01-01`, year: y },
  { id: 3, title: "Run a 5k under 25 minutes",      status: "todo",   created: `${y}-01-01`, year: y },
  { id: 4, title: "Learn Japanese to N4 level",     status: "todo",   created: `${y}-01-01`, year: y },
  { id: 5, title: "Complete 150 gym sessions",      status: "done",   created: `${y}-01-01`, year: y, completedAt: `${y}-03-01` },
  { id: 6, title: "Cook a new recipe every month",  status: "done",   created: `${y}-01-01`, year: y, completedAt: `${y}-02-28` },
];

// ── Obsidian files ────────────────────────────────────────────────────────────

export const DEMO_OBSIDIAN_FILES: ObsidianFile[] = [
  { path: "Daily/2026-04-08.md",            name: "2026-04-08",                      folder: "Daily",   mtime: Date.now() - 2 * 3600000,   links: [], tags: ["daily"] },
  { path: "Daily/2026-04-07.md",            name: "2026-04-07",                      folder: "Daily",   mtime: Date.now() - 26 * 3600000,  links: [], tags: ["daily"] },
  { path: "Projects/Side Project v2.md",    name: "Side Project v2",                 folder: "Projects", mtime: Date.now() - 3 * 3600000,  links: ["Tech Stack", "Roadmap"], tags: ["project"] },
  { path: "Books/Atomic Habits.md",         name: "Atomic Habits",                   folder: "Books",   mtime: Date.now() - 5 * 86400000,  links: [], tags: ["book", "notes"] },
  { path: "Ideas/App Redesign Thoughts.md", name: "App Redesign Thoughts",           folder: "Ideas",   mtime: Date.now() - 8 * 86400000,  links: [], tags: ["ideas", "design"] },
  { path: "Projects/Roadmap.md",            name: "Roadmap",                          folder: "Projects", mtime: Date.now() - 9 * 86400000, links: ["Side Project v2"], tags: ["project"] },
  { path: "Notes/Tokyo Travel Notes.md",    name: "Tokyo Travel Notes",              folder: "Notes",   mtime: Date.now() - 14 * 86400000, links: [], tags: [] },
  { path: "Notes/Meeting — Q1 Review.md",   name: "Meeting — Q1 Review",             folder: "Notes",   mtime: Date.now() - 18 * 86400000, links: [], tags: ["work"] },
  { path: "Books/Dune Summary.md",          name: "Dune Summary",                    folder: "Books",   mtime: Date.now() - 25 * 86400000, links: [], tags: ["book", "notes"] },
  { path: "Ideas/Language Learning Plan.md","name": "Language Learning Plan",         folder: "Ideas",   mtime: Date.now() - 30 * 86400000, links: [], tags: ["japanese"] },
  { path: "Tech Stack.md",                  name: "Tech Stack",                      folder: "",        mtime: Date.now() - 35 * 86400000, links: ["Side Project v2"], tags: [] },
  { path: "Daily/2026-03-30.md",            name: "2026-03-30",                      folder: "Daily",   mtime: Date.now() - 40 * 86400000, links: [], tags: ["daily"] },
];
