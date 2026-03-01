import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import type { TimeFormat } from "@/lib/types";

type Coords = { lat: number; lon: number; tz: string };
const DEFAULT_COORDS: Coords = { lat: 25.3573, lon: 55.4033, tz: "Asia/Dubai" };

export function getPrayerTimes(coords: Coords = DEFAULT_COORDS, timeFormat: TimeFormat = "12h") {
  const c = new Coordinates(coords.lat, coords.lon);
  const params = CalculationMethod.Dubai();
  const pt = new PrayerTimes(c, new Date(), params);

  const fmt = (d: Date) =>
    timeFormat === "24h"
      ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: coords.tz })
      : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: coords.tz });

  // Minutes since midnight in the prayer timezone — used for "next prayer" comparisons
  const toMins = (d: Date): number => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: coords.tz, hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(d);
    const h = parseInt(parts.find(p => p.type === "hour")?.value ?? "0");
    const m = parseInt(parts.find(p => p.type === "minute")?.value ?? "0");
    return (h % 24) * 60 + m;
  };

  return [
    { name: "Fajr",    time: fmt(pt.fajr),    mins: toMins(pt.fajr)    },
    { name: "Dhuhr",   time: fmt(pt.dhuhr),   mins: toMins(pt.dhuhr)   },
    { name: "Asr",     time: fmt(pt.asr),     mins: toMins(pt.asr)     },
    { name: "Maghrib", time: fmt(pt.maghrib), mins: toMins(pt.maghrib) },
    { name: "Isha",    time: fmt(pt.isha),    mins: toMins(pt.isha)    },
  ];
}
