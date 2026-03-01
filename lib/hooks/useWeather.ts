"use client";

import { useState, useEffect } from "react";

const WX_MAP: Record<number, string> = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy",
  51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Rain",
  71: "Snow", 73: "Snow", 75: "Snow",
  80: "Showers", 81: "Showers", 82: "Showers",
  95: "Thunderstorm",
};

export function useWeather() {
  const [wx, setWx] = useState({ temp: "--", condition: "--", sunrise: "--:--", sunset: "--:--", loaded: false });
  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=25.3573&longitude=55.4033&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=Asia%2FDubai&forecast_days=1"
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
  }, []);
  return wx;
}
