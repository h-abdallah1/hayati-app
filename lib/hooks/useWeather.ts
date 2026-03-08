"use client";

import { useState, useEffect } from "react";
import { DEFAULT_COORDS, type Coords } from "@/lib/constants";

const WX_MAP: Record<number, string> = {
  0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Foggy",
  51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Rain",
  71: "Snow", 73: "Snow", 75: "Snow",
  80: "Showers", 81: "Showers", 82: "Showers",
  95: "Thunderstorm",
};

type HourlyEntry = { time: string; temp: number; condition: string };

type WeatherState = {
  temp: string;
  condition: string;
  sunrise: string;
  sunset: string;
  feelsLike: string;
  humidity: string;
  wind: string;
  uvIndex: string;
  hourly: HourlyEntry[];
  loaded: boolean;
};

const DEFAULT_WX: WeatherState = {
  temp: "--", condition: "--", sunrise: "--:--", sunset: "--:--",
  feelsLike: "--", humidity: "--", wind: "--", uvIndex: "--",
  hourly: [],
  loaded: false,
};

export function useWeather(coords: Coords = DEFAULT_COORDS) {
  const [wx, setWx] = useState<WeatherState>(DEFAULT_WX);
  const coordsKey = `${coords.lat},${coords.lon},${coords.tz}`;

  useEffect(() => {
    const tz = encodeURIComponent(coords.tz);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m` +
      `&hourly=temperature_2m,weather_code,uv_index` +
      `&daily=sunrise,sunset` +
      `&timezone=${tz}&forecast_days=1`
    )
      .then(r => r.json())
      .then(data => {
        const code: number = data.current.weather_code;
        const currentTime: string = data.current.time;
        const hourlyTimes: string[] = data.hourly.time;
        const startIdx = Math.max(0, hourlyTimes.findIndex((t: string) => t === currentTime));

        const hourly: HourlyEntry[] = Array.from({ length: 8 }, (_, i) => ({
          time: (hourlyTimes[startIdx + i] ?? "").slice(11, 16),
          temp: Math.round(data.hourly.temperature_2m[startIdx + i] ?? 0),
          condition: WX_MAP[data.hourly.weather_code[startIdx + i]] ?? "Clear",
        })).filter((_, i) => startIdx + i < hourlyTimes.length);

        setWx({
          temp: `${Math.round(data.current.temperature_2m)}°`,
          condition: WX_MAP[code] ?? "Clear",
          sunrise: data.daily.sunrise[0].slice(11, 16),
          sunset: data.daily.sunset[0].slice(11, 16),
          feelsLike: `${Math.round(data.current.apparent_temperature)}°`,
          humidity: `${data.current.relative_humidity_2m}%`,
          wind: `${Math.round(data.current.wind_speed_10m)} km/h`,
          uvIndex: `${Math.round(data.hourly.uv_index[startIdx] ?? 0)}`,
          hourly,
          loaded: true,
        });
      })
      .catch(() => {});
  }, [coordsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return wx;
}
