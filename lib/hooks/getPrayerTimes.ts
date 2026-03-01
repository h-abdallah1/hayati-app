import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

type Coords = { lat: number; lon: number; tz: string };
const DEFAULT_COORDS: Coords = { lat: 25.3573, lon: 55.4033, tz: "Asia/Dubai" };

export function getPrayerTimes(coords: Coords = DEFAULT_COORDS) {
  const c = new Coordinates(coords.lat, coords.lon);
  const params = CalculationMethod.Dubai();
  const pt = new PrayerTimes(c, new Date(), params);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: coords.tz });
  return [
    { name: "Fajr",    time: fmt(pt.fajr)    },
    { name: "Dhuhr",   time: fmt(pt.dhuhr)   },
    { name: "Asr",     time: fmt(pt.asr)     },
    { name: "Maghrib", time: fmt(pt.maghrib) },
    { name: "Isha",    time: fmt(pt.isha)    },
  ];
}
