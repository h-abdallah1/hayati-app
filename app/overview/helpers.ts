export type ActivityCategory = "gym" | "film" | "note";

export type DayActivity = {
  date: string; // YYYY-MM-DD
  categories: Set<ActivityCategory>;
};

export type ActivityFeedEntry = {
  date: string; // YYYY-MM-DD
  items: { category: ActivityCategory; label: string }[];
};

/** Returns ISO date string YYYY-MM-DD for a Date object in local time */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns all Date objects for a given year (local time), starting Monday-aligned */
export function buildYearDays(year: number): Date[] {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

/**
 * Builds a map of date → set of active categories.
 * gymDates, filmDates, noteDates are arrays of YYYY-MM-DD strings.
 */
export function mergeActivities(
  gymDates: string[],
  filmDates: string[],
  noteDates: string[]
): Map<string, Set<ActivityCategory>> {
  const map = new Map<string, Set<ActivityCategory>>();

  function add(date: string, cat: ActivityCategory) {
    if (!map.has(date)) map.set(date, new Set());
    map.get(date)!.add(cat);
  }

  for (const d of gymDates) add(d, "gym");
  for (const d of filmDates) add(d, "film");
  for (const d of noteDates) add(d, "note");

  return map;
}

/**
 * Builds a sorted (descending) activity feed from the activity map
 * and per-category detail records.
 */
export function buildActivityFeed(
  activityMap: Map<string, Set<ActivityCategory>>,
  gymDetails: { date: string; label: string }[],
  filmDetails: { date: string; label: string }[],
  noteDetails: { date: string; label: string }[]
): ActivityFeedEntry[] {
  const byDate = new Map<string, { category: ActivityCategory; label: string }[]>();

  function addEntry(date: string, category: ActivityCategory, label: string) {
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push({ category, label });
  }

  for (const { date, label } of gymDetails) addEntry(date, "gym", label);
  for (const { date, label } of filmDetails) addEntry(date, "film", label);
  for (const { date, label } of noteDetails) addEntry(date, "note", label);

  // Only include dates that are in the activity map
  const entries: ActivityFeedEntry[] = [];
  for (const [date, items] of byDate.entries()) {
    if (activityMap.has(date)) {
      entries.push({ date, items });
    }
  }

  // Sort descending
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

/** Format YYYY-MM-DD as "Mar 3" */
export function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format YYYY-MM-DD as "Monday, March 3" */
export function formatDateFull(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/** Returns MONTH_LABELS for the grid (one label per month start column) */
export function getMonthStartCols(year: number): { label: string; col: number }[] {
  const result: { label: string; col: number }[] = [];
  // First day of year's day-of-week (0=Sun..6=Sat), shifted to Mon-based (0=Mon..6=Sun)
  const jan1 = new Date(year, 0, 1);
  const jan1dow = (jan1.getDay() + 6) % 7; // Mon=0

  for (let month = 0; month < 12; month++) {
    const firstOfMonth = new Date(year, month, 1);
    const dayOfYear = Math.floor((firstOfMonth.getTime() - jan1.getTime()) / 86400000);
    const col = Math.floor((dayOfYear + jan1dow) / 7);
    result.push({
      label: firstOfMonth.toLocaleDateString("en-US", { month: "short" }),
      col,
    });
  }
  return result;
}
