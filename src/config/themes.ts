export interface ColorScheme {
  // Core colors
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;

  // UI colors
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;

  // Feedback colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Border and input
  border: string;
  input: string;
  ring: string;

  // Chart colors (for analytics)
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ColorScheme;
  contrastRatio: 'normal' | 'high' | 'extra-high';
}

export const THEMES: Record<string, Theme> = {
  light: {
    id: 'light',
    name: 'Light',
    description: 'Standard light theme',
    contrastRatio: 'normal',
    colors: {
      // Core colors
      background: '0 0% 100%',
      foreground: '0 0% 12%',
      primary: '120 61% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '120 50% 95%',
      secondaryForeground: '120 50% 25%',
      accent: '120 50% 95%',
      accentForeground: '120 50% 25%',

      // UI colors
      muted: '0 0% 96%',
      mutedForeground: '0 0% 45%',
      card: '0 0% 100%',
      cardForeground: '0 0% 12%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 12%',

      // Feedback colors (WCAG AA compliant)
      success: '120 61% 35%', // Dark green for AA contrast
      warning: '38 92% 35%', // Dark orange for AA contrast
      error: '0 84% 45%', // Red with AA contrast
      info: '217 91% 45%', // Blue with AA contrast

      // Border and input
      border: '0 0% 92%',
      input: '0 0% 92%',
      ring: '120 61% 50%',

      // Chart colors (distinguishable and accessible)
      chart1: '221 83% 53%', // Blue
      chart2: '142 76% 36%', // Green
      chart3: '280 87% 47%', // Purple
      chart4: '25 95% 53%', // Orange
      chart5: '340 82% 52%', // Pink/Red
    }
  },

  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Standard dark theme',
    contrastRatio: 'normal',
    colors: {
      // Core colors
      background: '0 0% 12%',
      foreground: '0 0% 98%',
      primary: '120 61% 50%',
      primaryForeground: '0 0% 12%',
      secondary: '120 30% 20%',
      secondaryForeground: '0 0% 98%',
      accent: '120 30% 20%',
      accentForeground: '0 0% 98%',

      // UI colors
      muted: '0 0% 20%',
      mutedForeground: '0 0% 65%',
      card: '0 0% 15%',
      cardForeground: '0 0% 98%',
      popover: '0 0% 15%',
      popoverForeground: '0 0% 98%',

      // Feedback colors (WCAG AA compliant on dark)
      success: '120 61% 60%', // Bright green for dark bg
      warning: '38 92% 65%', // Bright orange for dark bg
      error: '0 84% 65%', // Bright red for dark bg
      info: '217 91% 65%', // Bright blue for dark bg

      // Border and input
      border: '0 0% 25%',
      input: '0 0% 25%',
      ring: '120 61% 50%',

      // Chart colors (bright and distinguishable on dark)
      chart1: '221 83% 65%', // Light blue
      chart2: '142 76% 55%', // Light green
      chart3: '280 87% 65%', // Light purple
      chart4: '25 95% 65%', // Light orange
      chart5: '340 82% 65%', // Light pink
    }
  },

  highContrastLight: {
    id: 'high-contrast-light',
    name: 'High Contrast Light',
    description: 'WCAG AAA compliant light theme with maximum contrast',
    contrastRatio: 'extra-high',
    colors: {
      // Core colors - Pure white bg, pure black text
      background: '0 0% 100%',
      foreground: '0 0% 0%',
      primary: '221 83% 25%', // Very dark blue (7:1+ contrast)
      primaryForeground: '0 0% 100%',
      secondary: '0 0% 20%', // Very dark gray
      secondaryForeground: '0 0% 100%',
      accent: '221 83% 25%',
      accentForeground: '0 0% 100%',

      // UI colors
      muted: '0 0% 95%',
      mutedForeground: '0 0% 0%', // Pure black for max contrast
      card: '0 0% 100%',
      cardForeground: '0 0% 0%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 0%',

      // Feedback colors (WCAG AAA - 7:1 contrast)
      success: '120 100% 20%', // Very dark green
      warning: '45 100% 25%', // Very dark yellow/gold
      error: '0 100% 30%', // Very dark red
      info: '221 83% 25%', // Very dark blue

      // Border and input - black for maximum visibility
      border: '0 0% 0%',
      input: '0 0% 0%',
      ring: '221 83% 25%',

      // Chart colors (AAA compliant, pattern-friendly)
      chart1: '221 100% 25%', // Very dark blue
      chart2: '120 100% 20%', // Very dark green
      chart3: '280 100% 25%', // Very dark purple
      chart4: '25 100% 30%', // Very dark orange
      chart5: '340 100% 30%', // Very dark red
    }
  },

  highContrastDark: {
    id: 'high-contrast-dark',
    name: 'High Contrast Dark',
    description: 'WCAG AAA compliant dark theme with maximum contrast',
    contrastRatio: 'extra-high',
    colors: {
      // Core colors - Pure black bg, pure white text
      background: '0 0% 0%',
      foreground: '0 0% 100%',
      primary: '210 100% 70%', // Very bright blue (7:1+ contrast)
      primaryForeground: '0 0% 0%',
      secondary: '0 0% 85%', // Very light gray
      secondaryForeground: '0 0% 0%',
      accent: '210 100% 70%',
      accentForeground: '0 0% 0%',

      // UI colors
      muted: '0 0% 10%',
      mutedForeground: '0 0% 100%', // Pure white for max contrast
      card: '0 0% 0%',
      cardForeground: '0 0% 100%',
      popover: '0 0% 0%',
      popoverForeground: '0 0% 100%',

      // Feedback colors (WCAG AAA - 7:1 contrast on black)
      success: '120 100% 55%', // Very bright green
      warning: '45 100% 65%', // Very bright yellow
      error: '0 100% 65%', // Very bright red
      info: '210 100% 70%', // Very bright blue

      // Border and input - white for maximum visibility
      border: '0 0% 100%',
      input: '0 0% 100%',
      ring: '210 100% 70%',

      // Chart colors (AAA compliant on black, very bright)
      chart1: '210 100% 70%', // Very bright blue
      chart2: '120 100% 55%', // Very bright green
      chart3: '280 100% 70%', // Very bright purple
      chart4: '25 100% 65%', // Very bright orange
      chart5: '340 100% 65%', // Very bright red
    }
  },

  yellowOnBlack: {
    id: 'yellow-on-black',
    name: 'Yellow on Black',
    description: 'Classic terminal-style high contrast theme',
    contrastRatio: 'extra-high',
    colors: {
      // Core colors - Classic terminal
      background: '0 0% 0%',
      foreground: '60 100% 75%', // Bright yellow
      primary: '60 100% 60%',
      primaryForeground: '0 0% 0%',
      secondary: '60 80% 50%',
      secondaryForeground: '0 0% 0%',
      accent: '60 100% 60%',
      accentForeground: '0 0% 0%',

      // UI colors
      muted: '0 0% 15%',
      mutedForeground: '60 100% 75%',
      card: '0 0% 5%',
      cardForeground: '60 100% 75%',
      popover: '0 0% 0%',
      popoverForeground: '60 100% 75%',

      // Feedback colors (yellow variations)
      success: '80 100% 60%', // Yellow-green
      warning: '45 100% 60%', // Orange-yellow
      error: '0 100% 60%', // Red (for critical only)
      info: '60 100% 75%', // Bright yellow

      // Border and input
      border: '60 100% 75%',
      input: '60 100% 75%',
      ring: '60 100% 60%',

      // Chart colors (yellow spectrum)
      chart1: '60 100% 75%', // Bright yellow
      chart2: '80 100% 60%', // Yellow-green
      chart3: '45 100% 60%', // Orange-yellow
      chart4: '90 100% 55%', // Lime
      chart5: '40 100% 65%', // Gold
    }
  },

  whiteOnBlack: {
    id: 'white-on-black',
    name: 'White on Black',
    description: 'Maximum contrast theme for ultimate readability',
    contrastRatio: 'extra-high',
    colors: {
      // Core colors - Maximum contrast
      background: '0 0% 0%',
      foreground: '0 0% 100%',
      primary: '0 0% 100%',
      primaryForeground: '0 0% 0%',
      secondary: '0 0% 85%',
      secondaryForeground: '0 0% 0%',
      accent: '0 0% 100%',
      accentForeground: '0 0% 0%',

      // UI colors
      muted: '0 0% 15%',
      mutedForeground: '0 0% 100%',
      card: '0 0% 5%',
      cardForeground: '0 0% 100%',
      popover: '0 0% 0%',
      popoverForeground: '0 0% 100%',

      // Feedback colors (grayscale with one colored accent)
      success: '0 0% 85%', // Light gray
      warning: '0 0% 70%', // Mid gray
      error: '0 100% 75%', // Bright red (only color)
      info: '0 0% 100%', // White

      // Border and input
      border: '0 0% 100%',
      input: '0 0% 100%',
      ring: '0 0% 100%',

      // Chart colors (grayscale with patterns needed)
      chart1: '0 0% 100%', // White
      chart2: '0 0% 85%', // Very light gray
      chart3: '0 0% 70%', // Light gray
      chart4: '0 0% 55%', // Mid gray
      chart5: '0 0% 40%', // Dark gray
    }
  },
};

export const DEFAULT_THEME = 'light';

export function getThemeById(id: string): Theme | undefined {
  return THEMES[id];
}

export function getAllThemes(): Theme[] {
  return Object.values(THEMES);
}

export function getThemesByContrastRatio(ratio: 'normal' | 'high' | 'extra-high'): Theme[] {
  return Object.values(THEMES).filter(theme => theme.contrastRatio === ratio);
}
