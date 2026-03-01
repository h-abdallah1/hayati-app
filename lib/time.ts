import type { TimeFormat } from "./types";

/** Format a Date object as a clock string. */
export function formatClock(date: Date, fmt: TimeFormat): string {
  const h = date.getHours(), m = date.getMinutes();
  if (fmt === "24h") return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Convert an already-formatted "HH:MM" string (from APIs) between formats. */
export function convertHHMM(hhmm: string, fmt: TimeFormat): string {
  if (fmt === "24h" || !hhmm.match(/^\d{2}:\d{2}$/)) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
