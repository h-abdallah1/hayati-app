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
