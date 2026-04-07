'use client';

import { useGlobalSettings } from '@/lib/settings';
import { useWeather } from '@/lib/hooks';
import { useTheme, useThemeToggle } from '@/lib/theme';
import { formatClock } from '@/lib/time';
import { Dot, Sep, Stat, Tag } from '@/components/ui';
import { getGreeting, FONT_HEADING } from '@/lib/constants';

export function HeaderBar({ time }: { time: Date }) {
  const C = useTheme();
  const { isDark } = useThemeToggle();
  const { global } = useGlobalSettings();
  const wx = useWeather(global.location);
  const h = time.getHours(),
    m = time.getMinutes(),
    s = time.getSeconds();
  const greet = getGreeting(time);
  const timeStr = formatClock(time, global.timeFormat);
  const dayFrac = (h * 3600 + m * 60 + s) / 86400;
  const daysInMonth = new Date(time.getFullYear(), time.getMonth() + 1, 0).getDate();
  const weekFrac = ((time.getDay() || 7) - 1 + dayFrac) / 7;
  const monthFrac = (time.getDate() - 1 + dayFrac) / daysInMonth;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dateStr = `${DAYS[time.getDay()]} · ${MONTHS[time.getMonth()]} ${time.getDate()}`;
  const startOfYear = new Date(time.getFullYear(), 0, 1).getTime();
  const startOfNextYear = new Date(time.getFullYear() + 1, 0, 1).getTime();
  const yearFrac = (time.getTime() - startOfYear) / (startOfNextYear - startOfYear);
  const metrics = [
    { label: 'day', frac: dayFrac, color: C.accent },
    { label: 'week', frac: weekFrac, color: C.teal },
    { label: 'month', frac: monthFrac, color: C.blue },
    { label: 'year', frac: yearFrac, color: '#a78bfa' },
  ];
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto 12px',
        background: isDark ? "rgba(20, 20, 20, 0.45)" : "rgba(255,255,255,0.58)",
        backdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6) brightness(1.05)",
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
        <span
          style={{
            fontFamily: FONT_HEADING,
            fontSize: 14,
            fontWeight: 700,
            color: C.textMuted,
          }}
        >
          {greet},&nbsp;<span style={{ color: C.text }}>{global.name}</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {metrics.map(({ label, frac, color }) => (
          <div key={label} style={{ width: 80 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 3,
              }}
            >
              <Tag color={C.textFaint}>{label}</Tag>
              <Tag color={color}>{(frac * 100).toFixed(0)}%</Tag>
            </div>
            <div style={{ height: 2, background: C.border, borderRadius: 2 }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(frac * 100, 100)}%`,
                  background: color,
                  borderRadius: 2,
                  boxShadow: `0 0 5px ${color}66`,
                }}
              />
            </div>
          </div>
        ))}
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
