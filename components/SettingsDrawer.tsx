'use client';

import { useTheme } from '@/lib/theme';
import { GeneralSection } from './settings/GeneralSection';
import { LocationSection } from './settings/LocationSection';
import { NewsFeedsSection } from './settings/NewsFeedsSection';
import { CalendarSection } from './settings/CalendarSection';
import { PanelsSection } from './settings/PanelsSection';
import { TravelSection } from './settings/TravelSection';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: Props) {
  const C = useTheme();

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          zIndex: 50,
          background: C.surface,
          borderLeft: `1px solid ${C.border}`,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚙</span>
            <span
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 800,
                fontSize: 14,
                color: C.text,
              }}
            >
              Settings
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: C.textMuted,
              padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          <GeneralSection open={open} />
          <LocationSection open={open} />
          <NewsFeedsSection open={open} />
          <CalendarSection />
          <PanelsSection />
          <TravelSection />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${C.border}`,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9,
            color: C.textFaint,
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          Changes save automatically
        </div>
      </div>
    </>
  );
}
