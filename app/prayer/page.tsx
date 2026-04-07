"use client";

import { useTheme, useThemeToggle } from "@/lib/theme";
import { useGlobalSettings } from "@/lib/settings";
import { useClock, getPrayerTimes, useWeather, useQuranVerse } from "@/lib/hooks";
import { convertHHMM, formatClock } from "@/lib/time";
import { Tag } from "@/components/ui";
import type { PrayerMethod } from "@/lib/types";

const PRAYER_METHODS: { value: PrayerMethod; label: string }[] = [
  { value: "Dubai",                 label: "Dubai"           },
  { value: "MuslimWorldLeague",     label: "MWL"             },
  { value: "NorthAmerica",          label: "ISNA"            },
  { value: "Egyptian",              label: "Egyptian"        },
  { value: "Karachi",               label: "Karachi"         },
  { value: "Kuwait",                label: "Kuwait"          },
  { value: "Qatar",                 label: "Qatar"           },
  { value: "Singapore",             label: "Singapore"       },
  { value: "Turkey",                label: "Turkey"          },
  { value: "MoonsightingCommittee", label: "Moonsighting"    },
];

function getTzOffset(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find(p => p.type === "timeZoneName")?.value ?? "";
  } catch { return ""; }
}

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

function qiblaDir(lat: number, lon: number): number {
  const toRad = (d: number) => d * Math.PI / 180;
  const φ1 = toRad(lat), φ2 = toRad(21.4225);
  const Δλ = toRad(39.8262 - lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function PrayerPage() {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const time = useClock();
  const { global, updateGlobal } = useGlobalSettings();
  const wx = useWeather(global.location);
  const verse = useQuranVerse();
  const PRAYER_TIMES = getPrayerTimes(global.location, global.timeFormat, global.prayerMethod);

  const tzOffset = getTzOffset(global.location.tz);

  // Current time in seconds since midnight (local)
  const curSecs = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds();
  const curMins = time.getHours() * 60 + time.getMinutes();

  // Find next prayer
  const nextPrayer = PRAYER_TIMES.find(p => p.mins * 60 > curSecs) ?? PRAYER_TIMES[0];
  const lastPrayer = [...PRAYER_TIMES].reverse().find(p => p.mins * 60 <= curSecs) ?? PRAYER_TIMES[PRAYER_TIMES.length - 1];

  // Seconds until next prayer (handle midnight wrap)
  let secsUntil = nextPrayer.mins * 60 - curSecs;
  if (secsUntil < 0) secsUntil += 86400;

  const countdownH = Math.floor(secsUntil / 3600);
  const countdownM = Math.floor((secsUntil % 3600) / 60);
  const countdownS = secsUntil % 60;
  const countdown = `${countdownH}:${padTwo(countdownM)}:${padTwo(countdownS)}`;

  // Progress bar fraction from last prayer to next
  let frac = 0;
  if (nextPrayer.mins !== lastPrayer.mins) {
    const lastSecs = lastPrayer.mins * 60;
    const nextSecsVal = nextPrayer.mins * 60 < lastSecs ? nextPrayer.mins * 60 + 86400 : nextPrayer.mins * 60;
    const curSecsAdj = curSecs < lastSecs ? curSecs + 86400 : curSecs;
    frac = Math.min(1, Math.max(0, (curSecsAdj - lastSecs) / (nextSecsVal - lastSecs)));
  }

  // Date labels
  const dateLabel = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", " ·");
  const hijriLabel = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
    day: "numeric", month: "long", year: "numeric",
  }).format(time);

  // Qibla
  const qibla = Math.round(qiblaDir(global.location.lat, global.location.lon));

  return (
    <div style={{ minHeight: "100vh", padding: "24px 28px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Location header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: C.text }}>PRAYER</span>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textMuted }}>
              {global.location.label}
              {tzOffset && <span style={{ color: C.textFaint, marginLeft: 8 }}>{tzOffset}</span>}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint }}>{dateLabel}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>{hijriLabel}</span>
          </div>
        </div>

        {/* Hero card */}
        <div style={{
          maxWidth: 480,
          margin: "0 auto 32px",
          background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "28px 32px",
          textAlign: "center",
        }}>
          <Tag color={C.textFaint}>next prayer</Tag>

          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 40, color: C.accent, marginTop: 12, marginBottom: 6 }}>
            {nextPrayer.name}
          </div>

          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.textFaint, marginBottom: 16 }}>
            {nextPrayer.time}
          </div>

          {/* Live clock */}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, color: C.textMuted, marginBottom: 8 }}>
            {formatClock(time, global.timeFormat)}
          </div>

          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, color: C.text, letterSpacing: "0.5px", marginBottom: 24 }}>
            {countdown}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${frac * 100}%`,
              background: C.accent,
              borderRadius: 2,
              boxShadow: `0 0 8px ${C.accent}66`,
              transition: "width 1s linear",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <Tag color={C.textFaint}>{lastPrayer.name}</Tag>
            <Tag color={C.textFaint}>{nextPrayer.name}</Tag>
          </div>
        </div>

        {/* Prayer list */}
        <div style={{
          background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 20,
        }}>
          {PRAYER_TIMES.map((p, i) => {
            const passed = p.mins < curMins;
            const isNextReal = p.name === nextPrayer.name;

            return (
              <div key={p.name}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 20px",
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 13,
                    color: passed && !isNextReal ? C.textFaint : isNextReal ? C.accent : C.textMuted,
                    textDecoration: passed && !isNextReal ? "line-through" : "none",
                    textDecorationColor: C.textFaint,
                    fontWeight: isNextReal ? 700 : 400,
                  }}>
                    {p.name}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 13,
                      color: passed && !isNextReal ? C.textFaint : isNextReal ? C.accent : C.text,
                      fontWeight: isNextReal ? 700 : 400,
                    }}>
                      {p.time}
                    </span>

                    {passed && !isNextReal && (
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: C.textFaint,
                        border: `1px solid ${C.border}`,
                        borderRadius: 4,
                        padding: "1px 6px",
                        letterSpacing: "0.4px",
                      }}>done</span>
                    )}
                    {isNextReal && (
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: C.accent,
                        border: `1px solid ${C.accentMid}`,
                        background: C.accentDim,
                        borderRadius: 4,
                        padding: "1px 6px",
                        letterSpacing: "0.4px",
                      }}>next ›</span>
                    )}
                  </div>
                </div>
                {i < PRAYER_TIMES.length - 1 && <div style={{ height: 1, background: C.border }} />}
              </div>
            );
          })}
        </div>

        {/* Calculation method selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>
            Calculation method
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {PRAYER_METHODS.map(m => (
              <button
                key={m.value}
                onClick={() => updateGlobal({ prayerMethod: m.value })}
                style={{
                  background: global.prayerMethod === m.value ? C.accentDim : "none",
                  border: `1px solid ${global.prayerMethod === m.value ? C.accentMid : C.border}`,
                  borderRadius: 5, cursor: "pointer",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                  color: global.prayerMethod === m.value ? C.accent : C.textFaint,
                  padding: "3px 9px", letterSpacing: "0.3px",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer context row */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          {wx.loaded && ([
            ["sunrise", convertHHMM(wx.sunrise, global.timeFormat)],
            ["sunset",  convertHHMM(wx.sunset,  global.timeFormat)],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag color={C.textFaint}>{k}</Tag>
              <Tag color={C.textMuted}>{v}</Tag>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tag color={C.textFaint}>qibla</Tag>
            <Tag color={C.textMuted}>{qibla}°</Tag>
          </div>
        </div>

        {/* Quran verse */}
        <div style={{
          background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "24px 28px", marginTop: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint, letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Verse of the day
            </div>
            {verse && (
              <a href={verse.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Tag color={C.textFaint}>{verse.ref} ↗</Tag>
              </a>
            )}
          </div>
          {verse ? (
            <>
              <div style={{ fontFamily: "'Scheherazade New',serif", fontSize: 26, color: C.text, direction: "rtl", textAlign: "right", lineHeight: 1.8, marginBottom: 16 }}>
                {verse.arabic}
              </div>
              <div style={{ height: 1, background: C.border, marginBottom: 14 }} />
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textMuted, lineHeight: 1.7, fontStyle: "italic" }}>
                "{verse.translation}"
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.textFaint }}>loading…</div>
          )}
        </div>

      </div>
    </div>
  );
}
