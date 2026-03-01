"use client";

import { useState, useEffect } from "react";

type Coords = { lat: number; lon: number; tz: string };
const DEFAULT_COORDS: Coords = { lat: 25.3573, lon: 55.4033, tz: "Asia/Dubai" };

const WX_MAP: Record<number, string> = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy",
  51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Rain",
  71: "Snow", 73: "Snow", 75: "Snow",
  80: "Showers", 81: "Showers", 82: "Showers",
  95: "Thunderstorm",
};

export function useWeather(coords: Coords = DEFAULT_COORDS) {
  const [wx, setWx] = useState({ temp: "--", condition: "--", sunrise: "--:--", sunset: "--:--", loaded: false });
  const coordsKey = `${coords.lat},${coords.lon},${coords.tz}`;
  useEffect(() => {
    const tz = encodeURIComponent(coords.tz);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=${tz}&forecast_days=1`
    )
      .then(r => r.json())
      .then(data => {
        const code: number = data.current.weather_code;
        setWx({
          temp: `${Math.round(data.current.temperature_2m)}°`,
          condition: WX_MAP[code] ?? "Clear",
          sunrise: data.daily.sunrise[0].slice(11, 16),
          sunset: data.daily.sunset[0].slice(11, 16),
          loaded: true,
        });
      })
      .catch(() => {});
  }, [coordsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return wx;
}
