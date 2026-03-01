import type { LocationCoords } from "@/lib/types";

export async function detectLocation(): Promise<LocationCoords> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { "Accept-Language": "en" } }
  );
  const d = await r.json();
  const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || d.name || "";
  const country = d.address?.country_code?.toUpperCase() || "";
  const label = [city, country].filter(Boolean).join(", ") || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  return { lat, lon, tz, label };
}

export async function searchLocation(query: string): Promise<LocationCoords> {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const results = await r.json();
  if (!results[0]) throw new Error("Location not found");

  const { lat: latStr, lon: lonStr, address } = results[0];
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const city = address?.city || address?.town || address?.village || address?.state || query;
  const country = address?.country_code?.toUpperCase() || "";
  const label = [city, country].filter(Boolean).join(", ");

  const tzR = await fetch(`https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`);
  const tzD = await tzR.json();
  const tz: string = tzD.timeZone || "UTC";

  return { lat, lon, tz, label };
}
