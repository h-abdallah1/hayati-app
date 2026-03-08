import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import type { TimeFormat, PrayerMethod } from "@/lib/types";
import { DEFAULT_COORDS, type Coords } from "@/lib/constants";

const METHOD_MAP: Record<PrayerMethod, () => ReturnType<typeof CalculationMethod.Dubai>> = {
  Dubai:                 CalculationMethod.Dubai,
  MuslimWorldLeague:     CalculationMethod.MuslimWorldLeague,
  NorthAmerica:          CalculationMethod.NorthAmerica,
  Egyptian:              CalculationMethod.Egyptian,
  Karachi:               CalculationMethod.Karachi,
  Kuwait:                CalculationMethod.Kuwait,
  Qatar:                 CalculationMethod.Qatar,
  Singapore:             CalculationMethod.Singapore,
  Turkey:                CalculationMethod.Turkey,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
};

export function getPrayerTimes(coords: Coords = DEFAULT_COORDS, timeFormat: TimeFormat = "12h", method: PrayerMethod = "Dubai") {
  const c = new Coordinates(coords.lat, coords.lon);
  const params = (METHOD_MAP[method] ?? CalculationMethod.Dubai)();
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
