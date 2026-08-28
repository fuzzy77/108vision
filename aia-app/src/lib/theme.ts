export const colors = {
  // Surface
  white: '#FFFFFF',
  surface: '#FFFFFF',
  // Ink — neutrals (108 Vision design system)
  ink50: '#F8FAFC',
  ink100: '#F1F5F9',
  ink200: '#E2E8F0',
  ink400: '#94A3B8',
  ink700: '#475569',
  ink800: '#334155',
  ink900: '#1E293B',
  ink950: '#0F172A',
  indigo: '#1E1B4B',
  // Primary — violet (brand accent)
  primary50: '#F5F3FF',
  primary100: '#EDE9FE',
  primary200: '#DDD6FE',
  primary400: '#A78BFA',
  primary500: '#8B5CF6',
  primary600: '#7C3AED',
  primary700: '#6D28D9',
  primary800: '#5B21B6',
  primary900: '#4C1D95',
  // Semantic
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
} as const;

export const gradients = {
  // hero: ink-950 → deep indigo → violet-900
  hero: ['#0F172A', '#1E1B4B', '#4C1D95'] as const,
  // cta: violet-700 → violet-600
  cta: ['#6D28D9', '#7C3AED'] as const,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

/** Soft card shadow (iOS + Android) */
export const cardShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

/** Violet glow (use on dark hero elements) */
export const glowShadow = {
  shadowColor: '#6D28D9',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.35,
  shadowRadius: 16,
  elevation: 8,
} as const;
