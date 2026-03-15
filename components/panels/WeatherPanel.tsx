'use client';

import { useRef } from 'react';
import { Droplets, Wind, Sun, Sunrise, Sunset } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useGlobalSettings } from '@/lib/settings';
import { useWeather, usePanelSize } from '@/lib/hooks';
import { Panel, Tag } from '@/components/ui';

export function WeatherPanel() {
  const C = useTheme();
  const { global } = useGlobalSettings();
  const wx = useWeather(global.location);
  const ref = useRef<HTMLDivElement>(null);
  const { height } = usePanelSize(ref);
  const compact = height > 0 && height < 220;

  const stats = [
    { icon: <Droplets size={10} strokeWidth={2} />, label: 'humidity', val: wx.humidity },
    { icon: <Wind     size={10} strokeWidth={2} />, label: 'wind',     val: wx.wind     },
    { icon: <Sun      size={10} strokeWidth={2} />, label: 'uv',       val: `UV ${wx.uvIndex}` },
    { icon: <Sunrise  size={10} strokeWidth={2} />, label: 'sunrise',  val: wx.sunrise  },
    { icon: <Sunset   size={10} strokeWidth={2} />, label: 'sunset',   val: wx.sunset   },
  ];

  return (
    <Panel ref={ref} style={{ display: 'flex', flexDirection: 'column', padding: compact ? 14 : 18 }}>
      {/* Header */}
      <div className="hayati-drag-handle" style={{ marginBottom: compact ? 8 : 12 }}>
        <Tag color={C.textFaint}>Weather · {global.location.label}</Tag>
      </div>

      {/* Current temp */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: compact ? 10 : 14 }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: compact ? 36 : 48,
          color: C.text,
          lineHeight: 1,
        }}>
          {wx.temp}
        </span>
        <div style={{ paddingBottom: compact ? 3 : 5 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: C.textMuted, lineHeight: 1.3 }}>
            {wx.condition}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textFaint, marginTop: 2 }}>
            feels {wx.feelsLike}
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      {!compact && (
        <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
          {stats.map(({ icon, label, val }) => (
            <div key={label}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.6px',
                marginBottom: 2,
              }}>
                {icon}{label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hourly strip */}
      {!compact && wx.hourly.length > 0 && (
        <>
          <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8, overflowX: 'hidden' }}>
            {wx.hourly.map((h, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, flex: 1, minWidth: 0,
              }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.textFaint }}>
                  {h.time}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text }}>
                  {h.temp}°
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                  color: C.textFaint, textAlign: 'center', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', width: '100%',
                }}>
                  {h.condition.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
