export const C_DARK = {
  bg: '#0c0c0c',
  surface: '#141414',
  surfaceHi: '#1c1c1c',
  border: '#282828',
  borderHi: '#363636',
  accent: '#c8f135',
  accentDim: '#c8f13522',
  accentMid: '#c8f13555',
  text: '#f0f0f0',
  textMuted: '#b0b0b0',
  textFaint: '#909090',
  red: '#ff5c5c',
  amber: '#ffb347',
  teal: '#4ecdc4',
  blue: '#5b9bd5',
};

export const C_LIGHT = {
  bg: '#f8f8f4',
  surface: '#ffffff',
  surfaceHi: '#f0f0eb',
  border: '#e0e0d8',
  borderHi: '#c8c8c0',
  accent: '#6baa00',
  accentDim: '#6baa0022',
  accentMid: '#6baa0055',
  text: '#1a1a1a',
  textMuted: '#555555',
  textFaint: '#b0b0a8',
  red: '#c0392b',
  amber: '#c87800',
  teal: '#1a8a82',
  blue: '#2563a8',
};

export type AccentTheme = {
  name: string;
  label: string;
  dark: string;
  light: string;
};

export const ACCENT_THEMES: AccentTheme[] = [
  { name: 'sage', label: 'Sage', dark: '#a8c47a', light: '#5a8a30' },
  { name: 'amber', label: 'Amber', dark: '#d4a574', light: '#b07030' },
  { name: 'teal', label: 'Teal', dark: '#6ec6b8', light: '#1a8a82' },
  { name: 'lavender', label: 'Lavender', dark: '#a394d9', light: '#6b5ab8' },
  { name: 'lime', label: 'Lime', dark: '#c8f135', light: '#6baa00' },
];
