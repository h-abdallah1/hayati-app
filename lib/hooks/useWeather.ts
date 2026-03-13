"use client";

import { useState, useEffect } from "react";
import { DEFAULT_COORDS, type Coords } from "@/lib/constants";

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
    fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&tz=${encodeURIComponent(coords.tz)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) return;
        setWx({ ...data, loaded: true });
      })
      .catch(() => {});
  }, [coordsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return wx;
}
