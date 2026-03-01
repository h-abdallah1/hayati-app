import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

const COORDS = { lat: 25.3573, lon: 55.4033, tz: "Asia/Dubai" };

export function getPrayerTimes() {
  const coords = new Coordinates(COORDS.lat, COORDS.lon);
  const params = CalculationMethod.Dubai();
  const pt = new PrayerTimes(coords, new Date(), params);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: COORDS.tz });
  return [
    { name: "Fajr",    time: fmt(pt.fajr)    },
    { name: "Dhuhr",   time: fmt(pt.dhuhr)   },
    { name: "Asr",     time: fmt(pt.asr)     },
    { name: "Maghrib", time: fmt(pt.maghrib) },
    { name: "Isha",    time: fmt(pt.isha)    },
  ];
}
