// web/app/_arcade/colors.ts
//
// Canvas-side hex constants for arcade-style games. Mirrors a subset of the
// Night Owl design tokens defined globally in `web/app/styles/tokens.css`.
// React/CSS code should use the CSS variables directly; this module exists
// because canvas 2D APIs need string colors, not CSS vars.
//
// Keep these values in sync with tokens.css.

export const colors = {
  primary: {
    light: '#AFC6FF',
    main: '#82AAFF',
    dark: '#4976A1',
  },
  secondary: {
    light: '#A3B7C7',
    main: '#8DA0AF',
    dark: '#2A3F51',
  },
  accent: {
    cyan: '#7fdbca',
    coral: '#FFAB70',
    green: '#C3E88D',
    pink: '#F07178',
    yellow: '#FFCB6B',
    purple: '#C792EA',
  },
  status: {
    playing: '#D4A44E',
    queued: '#4EA8C4',
    completed: '#6DAE6A',
    dropped: '#C87070',
    backlog: '#9878BE',
  },
  semantic: {
    success: '#C3E88D',
    warning: '#FFCB6B',
    error: '#F07178',
    info: '#82AAFF',
  },
  background: {
    base: '#011627',
    elevated: '#132A3E',
    surface: '#0A1E30',
    medium: '#1D3B53',
    light: '#D6DEEB',
    floor: '#010E18',
    scrim: 'rgba(1, 22, 39, 0.6)',
  },
  text: {
    primary: '#D6DEEB',
    secondary: '#9DB2C0',
    muted: '#7E8E94',
    inverse: '#011627',
  },
  neutral: {
    white: '#FFFFFF',
    lightGray: '#D6DEEB',
    gray: '#637777',
    darkGray: '#1D3B53',
    black: '#000000',
  },
} as const;

export type ArcadeColors = typeof colors;
