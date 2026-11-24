export type AppMode = 'light' | 'dark';

export const designTokens = {
  light: {
    bg: '#F6F8FA',
    card: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    input: '#F8FAFC',
    blue: '#1E3A8A',
    primary: '#1E3A8A',
    soft: '#F1F5F9',
    green: '#14532D',
    secondary: '#14532D',
    amber: '#D97706',
    accent: '#FBBF24',
    red: '#DC5454',
    text: '#172033',
    textPrimary: '#172033',
    muted: '#64748B',
    textSecondary: '#475569',
    textMuted: '#64748B',
    border: '#E2E8F0',
    success: '#15803D',
    error: '#DC5454',
    review: '#6D28D9',
    unvisited: '#94A3B8',
    physicsBg: '#DBEAFE',
    physicsFg: '#1D4ED8',
    chemistryBg: '#DCFCE7',
    chemistryFg: '#166534',
    mathematicsBg: '#FEF3C7',
    mathematicsFg: '#92400E',
  },
  dark: {
    bg: '#0B1220',
    card: '#121D2D',
    surfaceElevated: '#1B2A3D',
    input: '#142238',
    blue: '#93C5FD',
    primary: '#A5B4FC',
    soft: '#1A2A40',
    green: '#4ADE80',
    secondary: '#60A5FA',
    amber: '#FBBF24',
    accent: '#F59E0B',
    red: '#FB7185',
    text: '#F8FAFC',
    textPrimary: '#F8FAFC',
    muted: '#94A3B8',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#2A3A50',
    success: '#4ADE80',
    error: '#FB7185',
    review: '#C4B5FD',
    unvisited: '#64748B',
    physicsBg: '#172B48',
    physicsFg: '#93C5FD',
    chemistryBg: '#16352D',
    chemistryFg: '#86EFAC',
    mathematicsBg: '#3A2D16',
    mathematicsFg: '#FCD34D',
  },
} as const;

export type ThemeColors = typeof designTokens[keyof typeof designTokens];

export const designMetrics = {
  radius: { small: 10, medium: 16, large: 22, modal: 24 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 28 },
  minimumTouchTarget: 44,
  contentMaxWidth: 720,
  colorRatio: { background: 60, surfaces: 30, accents: 10 },
} as const;

export const subjectTokens = {
  Physics: { background: 'physicsBg', foreground: 'physicsFg', icon: 'atom' },
  Chemistry: { background: 'chemistryBg', foreground: 'chemistryFg', icon: 'flask' },
  Mathematics: { background: 'mathematicsBg', foreground: 'mathematicsFg', icon: 'sigma' },
} as const;

export const questionStatusTokens = {
  answered: { label: 'Answered', icon: 'check', color: 'success' },
  not_answered: { label: 'Not Answered', icon: 'square', color: 'error' },
  review: { label: 'Marked for Review', icon: 'bookmark', color: 'review' },
  not_visited: { label: 'Not Visited', icon: 'minus-square', color: 'unvisited' },
} as const;
