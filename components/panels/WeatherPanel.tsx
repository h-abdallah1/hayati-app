"use client";

import { useTheme } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useWeather } from "@/lib/hooks";
import { convertHHMM } from "@/lib/time";
import { Panel, Tag } from "@/components/ui";

type Theme = ReturnType<typeof useTheme>;

const CONDITION_ICON: Record<string, string> = {
  "Clear":         "○",
  "Mostly Clear":  "◌",
  "Partly Cloudy": "◑",
  "Overcast":      "●",
  "Foggy":         "≋",
  "Drizzle":       "·",
  "Rain":          "▾",
  "Snow":          "✦",
  "Showers":       "▿",
  "Thunderstorm":  "⚡",
};

function tempColor(temp: number, C: Theme): string {
  if (temp <= 15) return C.blue;
  if (temp <= 22) return C.teal;
  if (temp <= 30) return C.accent;
  if (temp <= 35) return C.amber;
  return C.red;
}

function uvColor(uv: number, C: Theme): string {
  if (uv <= 2) return C.teal;
  if (uv <= 5) return C.accent;
  if (uv <= 7) return C.amber;
  return C.red;
}

function conditionTint(condition: string, C: Theme): string {
  if (condition.includes("Rain") || condition.includes("Drizzle") || condition.includes("Shower")) return C.blue;
  if (condition.includes("Thunder")) return C.red;
  if (condition.includes("Snow")) return C.teal;
  if (condition === "Clear" || condition === "Mostly Clear") return C.amber;
  return C.textFaint;
}

function buildSparkPath(temps: number[]): string {
  if (temps.length < 2) return "";
  const W = 600, H = 60;
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const pts = temps.map((t, i) => ({
    x: (i / (temps.length - 1)) * W,
    y: 8 + (1 - (t - min) / range) * 44,
  }));
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C ${cpx},${prev.y.toFixed(1)} ${cpx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");
}

export function WeatherPanel() {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const wx = useWeather(global.location);

  const heroTemp  = parseInt(wx.temp) || 0;
  const heroColor = tempColor(heroTemp, C);
  const tintColor = conditionTint(wx.condition, C);
  const condIcon  = CONDITION_ICON[wx.condition] ?? "○";
  const uvVal     = parseInt(wx.uvIndex) || 0;

  const linePath  = buildSparkPath(wx.hourly.map(h => h.temp));
  const fillPath  = linePath ? `${linePath} L 600,60 L 0,60 Z` : "";
  const startColor = wx.hourly.length ? tempColor(wx.hourly[0].temp, C) : heroColor;
  const endColor   = wx.hourly.length ? tempColor(wx.hourly[wx.hourly.length - 1].temp, C) : heroColor;

  const stats = [
    { icon: "≈", label: "feels like", value: wx.feelsLike, color: tempColor(parseInt(wx.feelsLike) || 0, C) },
    { icon: "◇", label: "humidity",   value: wx.humidity,  color: C.text },
    { icon: "→", label: "wind",       value: wx.wind,      color: C.text },
    { icon: "◉", label: "UV index",   value: wx.uvIndex,   color: uvColor(uvVal, C) },
  ];

  return (
    <Panel style={{ gridColumn: "span 2", display: "flex", flexDirection: "column" }}>
      {/* Condition background tint */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 15% 45%, ${tintColor}14 0%, transparent 55%)`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Tag color={C.textFaint}>Weather</Tag>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
          {global.location.label}
        </span>
      </div>

      {/* Main */}
      <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>

        {/* Left — hero temp */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, minWidth: 130 }}>
          <div>
            <div style={{
              fontFamily: "'Syne',sans-serif", fontSize: 56, fontWeight: 800,
              color: heroColor, lineHeight: 1, letterSpacing: "-2px",
              textShadow: `0 0 32px ${heroColor}55`,
            }}>
              {wx.temp}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: tintColor }}>
                {condIcon}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textMuted }}>
                {wx.condition}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
              ↑ {convertHHMM(wx.sunrise, global.timeFormat)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>
              ↓ {convertHHMM(wx.sunset, global.timeFormat)}
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />

        {/* Right — stats grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", alignContent: "center" }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint,
                textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                {s.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: s.color, letterSpacing: "-0.3px" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: "20px 0 0" }} />

      {/* Sparkline */}
      <div style={{ marginTop: 16 }}>
        <svg viewBox="0 0 600 60" preserveAspectRatio="none" style={{ width: "100%", height: 60, display: "block" }}>
          <defs>
            <linearGradient id="wx-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={startColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={startColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="wx-stroke" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
          {fillPath && <path d={fillPath} fill="url(#wx-fill)" />}
          {linePath && (
            <path
              d={linePath} fill="none"
              stroke="url(#wx-stroke)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Hour labels */}
        <div style={{ display: "flex", marginTop: 8 }}>
          {wx.hourly.map((h, i) => {
            const hColor = tempColor(h.temp, C);
            const hIcon  = CONDITION_ICON[h.condition] ?? "○";
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: i === 0 ? hColor : C.textFaint, opacity: 0.7 }}>
                  {hIcon}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  color: i === 0 ? hColor : C.textMuted,
                  fontWeight: i === 0 ? 700 : 400,
                }}>
                  {h.temp}°
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: i === 0 ? hColor : C.textFaint }}>
                  {i === 0 ? "now" : h.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
