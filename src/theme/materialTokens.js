/**
 * Material Design 3 (M3) Color, Typography, and Shape Tokens for Andil
 * Mengacu pada Bagian 6 MVP.md (M3 Baseline & Education Color Roles)
 */

export const materialTokens = {
  colors: {
    primary: '#0B57D0',
    primaryHover: '#0842A0',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D3E3FD',
    onPrimaryContainer: '#041E49',
    secondaryContainer: '#C2E7FF',
    onSecondaryContainer: '#001D35',
    surface: '#F8FAFD',
    surfaceWhite: '#FFFFFF',
    surfaceContainerLow: '#F0F4F9',
    surfaceContainerHigh: '#E9EEF6',
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',
    onSurface: '#0F172A',
    onSurfaceVariant: '#475569',
    status: {
      notStarted: {
        bg: '#E2E8F0',
        text: '#334155',
        dot: '#64748B',
        label: 'Not Started',
      },
      inProgress: {
        bg: '#D3E3FD',
        text: '#0B57D0',
        dot: '#0B57D0',
        label: 'In Progress',
      },
      onHold: {
        bg: '#FEF3C7',
        text: '#B45309',
        dot: '#F59E0B',
        label: 'On Hold / Terkendala',
      },
      completed: {
        bg: '#D1FAE5',
        text: '#047857',
        dot: '#10B981',
        label: 'Completed',
      },
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Roboto', sans-serif",
    scale: {
      display: 'text-[32px] sm:text-[44px] font-extrabold leading-[1.18] tracking-[-0.02em]',
      headline: 'text-[24px] sm:text-[28px] font-extrabold leading-[1.25] tracking-[-0.015em]',
      title: 'text-[18px] sm:text-[20px] font-bold leading-[1.35]',
      body: 'text-[14px] sm:text-[15px] font-normal leading-[1.6]',
      label: 'text-[12.5px] sm:text-[13.5px] font-semibold leading-[1.4]',
    },
  },
  shapes: {
    fullPill: 'rounded-full',
    heroCard: 'rounded-[32px]',
    dialogModal: 'rounded-[28px]',
    extraLarge: 'rounded-3xl',
    large: 'rounded-2xl',
    medium: 'rounded-xl',
  },
};

export const M3_COLORS = materialTokens.colors;
export const M3_SHAPES = materialTokens.shapes;
export const M3_TYPOGRAPHY = materialTokens.typography;

export default materialTokens;
