export const Colors = {
  primary: '#1a3a5c',
  background: '#ffffff',
  accent: '#2E75B6',
  success: '#27ae60',
  error: '#e74c3c',
  text: '#333333',
  textLight: '#888888',
};

export const Typography = {
  heading: {
    fontWeight: 'bold' as const,
    fontSize: 24,
  },
  body: {
    fontWeight: 'normal' as const,
    fontSize: 16,
  },
  button: {
    fontWeight: 'bold' as const,
    fontSize: 18,
  },
};

export const Spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const BorderRadius = {
  card: 12,
  button: 8,
};

// Unlock durations in milliseconds
export const UnlockDuration = {
  correct: 5 * 60 * 1000,
  wrong: 3 * 60 * 1000,
};
