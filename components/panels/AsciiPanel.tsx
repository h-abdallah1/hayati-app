'use client';

import { useTheme } from '@/lib/theme';
import { Panel, Tag } from '@/components/ui';

const ART_PIECES = [
  // Neko / catgirl face
  `  /\\_/\\
 ( ^ω^ )
  > ♡ <
 (_____)
  nya~    `,

  // Chibi sword pose
  `  o
 /|\\
  |  /7
 / \\/
sword~    `,

  // Sleeping character
` (-.-)zzz
  _|_
  | |
 _|_|_
oyasumi~   `,

  // Surprised reaction
`  (°□°)
  /|  |\\
   |  |
  / \\/ \\
NANI?!    `,

  // "desu" cat
`  /\\_/\\
 (=^.^=)
  )   (
 (__|__)
  desu!   `,

  // Simple mecha
`  [===]
 /|o o|\\
( |   | )
  |___|
  / \\    `,

  // Crying anime girl
`  (T_T)
  /|  |\\
   |  |
  _|__|_
 ;_;  sob `,

  // Heart / love
`   \\   /
 \\(>.<)/
  ( ♡ )
   \\|/
  ~love~  `,
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function AsciiPanel() {
  const C = useTheme();
  const index = getDayOfYear(new Date()) % ART_PIECES.length;
  const art = ART_PIECES[index];

  return (
    <Panel style={{ display: 'flex', flexDirection: 'column', padding: 14 }}>
      <div
        className="hayati-drag-handle"
        style={{ marginBottom: 8 }}
      >
        <Tag color={C.textFaint}>ascii art</Tag>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <pre
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            lineHeight: 1.3,
            color: C.textMuted,
            margin: 0,
            userSelect: 'none',
            whiteSpace: 'pre',
          }}
        >
          {art}
        </pre>
      </div>
    </Panel>
  );
}
