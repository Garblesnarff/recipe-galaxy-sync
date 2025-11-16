import { supabase } from '@/integrations/supabase/client';
import { Theme, getThemeById, DEFAULT_THEME } from '@/config/themes';
import { ColorScheme } from '@/config/themes';
import { getContrastRatio, meetsWCAG } from './colorUtils';

export interface ContrastReport {
  theme: string;
  passes: boolean;
  issues: ContrastIssue[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
  };
}

export interface ContrastIssue {
  pair: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  level: 'AA' | 'AAA';
  size: 'normal' | 'large';
}

/**
 * Save theme preference to user profile
 */
export async function saveThemePreference(userId: string, themeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ theme_preference: themeId })
      .eq('id', userId);

    if (error) throw error;

    // Also save to localStorage as backup
    localStorage.setItem('theme-preference', themeId);
  } catch (error) {
    console.error('Error saving theme preference:', error);
    // Fall back to localStorage only
    localStorage.setItem('theme-preference', themeId);
  }
}

/**
 * Get theme preference from user profile or localStorage
 */
export async function getThemePreference(userId: string | null): Promise<string> {
  // Try localStorage first (faster)
  const localTheme = localStorage.getItem('theme-preference');
  if (localTheme) return localTheme;

  // If no user, return default
  if (!userId) return DEFAULT_THEME;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('theme_preference')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const themeId = data?.theme_preference || DEFAULT_THEME;
    localStorage.setItem('theme-preference', themeId);
    return themeId;
  } catch (error) {
    console.error('Error getting theme preference:', error);
    return DEFAULT_THEME;
  }
}

/**
 * Apply theme to the document
 */
export function applyTheme(themeId: string): void {
  const theme = getThemeById(themeId);
  if (!theme) {
    console.warn(`Theme ${themeId} not found, using default`);
    applyTheme(DEFAULT_THEME);
    return;
  }

  // Remove all existing theme classes
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark', 'light');

  // Apply new theme
  document.documentElement.setAttribute('data-theme', themeId);

  // Add dark class for Tailwind dark mode if it's a dark theme
  if (themeId.includes('dark') || themeId === 'yellow-on-black' || themeId === 'white-on-black') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.add('light');
  }

  // Apply theme colors to CSS variables
  applyThemeColors(theme.colors);
}

/**
 * Apply theme colors to CSS custom properties
 */
function applyThemeColors(colors: ColorScheme): void {
  const root = document.documentElement.style;

  // Core colors
  root.setProperty('--background', colors.background);
  root.setProperty('--foreground', colors.foreground);
  root.setProperty('--primary', colors.primary);
  root.setProperty('--primary-foreground', colors.primaryForeground);
  root.setProperty('--secondary', colors.secondary);
  root.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.setProperty('--accent', colors.accent);
  root.setProperty('--accent-foreground', colors.accentForeground);

  // UI colors
  root.setProperty('--muted', colors.muted);
  root.setProperty('--muted-foreground', colors.mutedForeground);
  root.setProperty('--card', colors.card);
  root.setProperty('--card-foreground', colors.cardForeground);
  root.setProperty('--popover', colors.popover);
  root.setProperty('--popover-foreground', colors.popoverForeground);

  // Feedback colors
  root.setProperty('--success', colors.success);
  root.setProperty('--warning', colors.warning);
  root.setProperty('--error', colors.error);
  root.setProperty('--destructive', colors.error);
  root.setProperty('--destructive-foreground', '0 0% 100%');
  root.setProperty('--info', colors.info);

  // Border and input
  root.setProperty('--border', colors.border);
  root.setProperty('--input', colors.input);
  root.setProperty('--ring', colors.ring);

  // Chart colors
  root.setProperty('--chart-1', colors.chart1);
  root.setProperty('--chart-2', colors.chart2);
  root.setProperty('--chart-3', colors.chart3);
  root.setProperty('--chart-4', colors.chart4);
  root.setProperty('--chart-5', colors.chart5);
}

/**
 * Validate all color contrasts in a theme
 */
export function validateColorContrast(theme: ColorScheme): ContrastReport {
  const issues: ContrastIssue[] = [];
  let totalChecks = 0;
  let passed = 0;

  // Checks to perform (foreground, background, level, size)
  const checks: Array<[string, string, string, 'AA' | 'AAA', 'normal' | 'large']> = [
    ['foreground on background', theme.foreground, theme.background, 'AA', 'normal'],
    ['primary foreground on primary', theme.primaryForeground, theme.primary, 'AA', 'normal'],
    ['secondary foreground on secondary', theme.secondaryForeground, theme.secondary, 'AA', 'normal'],
    ['accent foreground on accent', theme.accentForeground, theme.accent, 'AA', 'normal'],
    ['muted foreground on background', theme.mutedForeground, theme.background, 'AA', 'normal'],
    ['card foreground on card', theme.cardForeground, theme.card, 'AA', 'normal'],
    ['popover foreground on popover', theme.popoverForeground, theme.popover, 'AA', 'normal'],
  ];

  for (const [pair, fg, bg, level, size] of checks) {
    totalChecks++;
    const fgColor = `hsl(${fg})`;
    const bgColor = `hsl(${bg})`;
    const ratio = getContrastRatio(fgColor, bgColor);
    const required = level === 'AAA' ? (size === 'large' ? 4.5 : 7) : (size === 'large' ? 3 : 4.5);

    if (meetsWCAG(ratio, level, size)) {
      passed++;
    } else {
      issues.push({
        pair,
        foreground: fg,
        background: bg,
        ratio,
        required,
        level,
        size,
      });
    }
  }

  return {
    theme: 'Custom Theme',
    passes: issues.length === 0,
    issues,
    summary: {
      totalChecks,
      passed,
      failed: issues.length,
    },
  };
}

/**
 * Detect system theme preference
 */
export function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Match system theme (apply light or dark based on system preference)
 */
export function matchSystemTheme(): void {
  const systemTheme = detectSystemTheme();
  applyTheme(systemTheme);
}

/**
 * Watch for system theme changes
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  // Older browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => {};
}

/**
 * Save visual preferences
 */
export interface VisualPreferences {
  textSize?: 'normal' | 'large' | 'extra-large';
  lineSpacing?: 'normal' | 'relaxed' | 'loose';
  fontFamily?: 'system' | 'sans' | 'serif' | 'mono';
  animationSpeed?: 'normal' | 'slow' | 'off';
  colorBlindMode?: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia';
  underlineLinks?: boolean;
  boldUi?: boolean;
}

export function saveVisualPreferences(prefs: VisualPreferences): void {
  localStorage.setItem('visual-preferences', JSON.stringify(prefs));
  applyVisualPreferences(prefs);
}

export function getVisualPreferences(): VisualPreferences {
  const stored = localStorage.getItem('visual-preferences');
  if (!stored) return {};

  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function applyVisualPreferences(prefs: VisualPreferences): void {
  const root = document.documentElement;

  if (prefs.textSize) {
    root.setAttribute('data-text-size', prefs.textSize);
  }

  if (prefs.lineSpacing) {
    root.setAttribute('data-line-spacing', prefs.lineSpacing);
  }

  if (prefs.fontFamily) {
    root.setAttribute('data-font-family', prefs.fontFamily);
  }

  if (prefs.animationSpeed) {
    root.setAttribute('data-reduce-motion', prefs.animationSpeed === 'off' ? 'true' : 'false');
  }

  if (prefs.colorBlindMode && prefs.colorBlindMode !== 'none') {
    root.setAttribute('data-color-blind-mode', prefs.colorBlindMode);
  } else {
    root.removeAttribute('data-color-blind-mode');
  }

  if (prefs.underlineLinks !== undefined) {
    root.setAttribute('data-underline-links', prefs.underlineLinks ? 'true' : 'false');
  }

  if (prefs.boldUi !== undefined) {
    root.setAttribute('data-bold-ui', prefs.boldUi ? 'true' : 'false');
  }
}
