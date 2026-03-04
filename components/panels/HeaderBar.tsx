'use client';

import { useGlobalSettings } from '@/lib/settings';
import { useWeather } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';
import { formatClock } from '@/lib/time';
import { Dot, Sep, Stat, Tag } from '@/components/ui';

export function HeaderBar({ time }: { time: Date }) {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const wx = useWeather(global.location);
  const h = time.getHours(),
    m = time.getMinutes(),
    s = time.getSeconds();
  const greeting =
    h < 5
      ? 'Good night'
      : h < 12
        ? 'Good morning'
        : h < 17
          ? 'Good afternoon'
          : h < 20
            ? 'Good evening'
            : 'Good night';
  const timeStr = formatClock(time, global.timeFormat);
  const dayFrac = (h * 3600 + m * 60 + s) / 86400;
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${DAYS[time.getDay()]} · ${MONTHS[time.getMonth()]} ${time.getDate()}`;
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto 12px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '14px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot size={6} />
          <span
            style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 800,
              fontSize: 14,
              color: C.accent,
              letterSpacing: '-0.3px',
            }}
          >
            Hayati
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: C.textFaint,
            }}
          >
            {'· حياتي'}
          </span>
        </div>
        <div style={{ width: 1, height: 20, background: C.border }} />
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: C.textMuted,
          }}
        >
          {greeting},&nbsp;<span style={{ color: C.text }}>{global.name}</span>
        </span>
      </div>
      <div style={{ flex: 1, maxWidth: 340 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <Tag color={C.textFaint}>day progress</Tag>
          <Tag color={C.textMuted}>{(dayFrac * 100).toFixed(0)}%</Tag>
        </div>
        <div
          style={{
            height: 3,
            background: C.border,
            borderRadius: 2,
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${dayFrac * 100}%`,
              background: `linear-gradient(90deg,${C.accent}77,${C.accent})`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -3,
              left: `${dayFrac * 100}%`,
              width: 1,
              height: 9,
              background: C.accent,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
      >
        <Stat label={`${wx.temp} · ${wx.condition}`} color={C.amber} />
        <Sep />
        <Stat icon="&#9711;" label={timeStr} />
        <Stat label={dateStr} dim />
      </div>
    </div>
  );
}
