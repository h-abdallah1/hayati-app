import type { HevyWorkoutFull, HevySet } from "@/app/api/hevy/workouts/route";

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
}

export function calcStreak(dates: string[]): number {
  const set = new Set(dates);
  const d   = new Date();
  if (!set.has(d.toISOString().split("T")[0])) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

export function calcWeekStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  function toISOWeek(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const dow = d.getDay() || 7; // Mon=1 … Sun=7
    d.setDate(d.getDate() + 4 - dow); // shift to nearest Thursday
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }
  function prevWeek(w: string): string {
    const [yr, wk] = w.split("-W").map(Number);
    if (wk > 1) return `${yr}-W${String(wk - 1).padStart(2, "0")}`;
    // last week of previous year
    return toISOWeek(`${yr - 1}-12-28`); // Dec 28 is always in the last ISO week
  }
  const weeks = new Set(dates.map(toISOWeek));
  let cur = toISOWeek(new Date().toISOString().split("T")[0]);
  if (!weeks.has(cur)) {
    cur = prevWeek(cur);
    if (!weeks.has(cur)) return 0;
  }
  let count = 0;
  while (weeks.has(cur)) { count++; cur = prevWeek(cur); }
  return count >= 3 ? count : 0;
}

export function weekStart(dateStr: string): string {
  const d   = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().split("T")[0];
}

export function setVolume(s: HevySet): number { return (s.weight_kg ?? 0) * (s.reps ?? 0); }

export function workoutVolume(w: HevyWorkoutFull): number {
  return w.exercises.reduce((t, ex) => t + ex.sets.reduce((s, set) => s + setVolume(set), 0), 0);
}

export const SPLIT_CAT = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes("push"))  return "Push";
  if (t.includes("pull"))  return "Pull";
  if (t.includes("leg"))   return "Legs";
  if (t.includes("upper")) return "Upper";
  if (t.includes("lower")) return "Lower";
  if (t.includes("full"))  return "Full Body";
  if (t.includes("cardio") || t.includes("run")) return "Cardio";
  return "Other";
};

export const MONTH_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAY_INITIALS = ["S","M","T","W","T","F","S"];
export const SHOW_DAY     = new Set([1, 3, 5]);

export function monthStartCols(jan1DOW: number, leap: boolean): number[] {
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const cols: number[] = []; let idx = jan1DOW;
  for (const d of days) { cols.push(Math.floor(idx / 7)); idx += d; }
  return cols;
}
