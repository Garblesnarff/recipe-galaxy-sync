export interface AccessibilityConfig {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderAnnouncements: boolean;
  keyboardShortcuts: boolean;
  focusIndicators: 'standard' | 'enhanced';
  textSize: 'small' | 'medium' | 'large' | 'xlarge';
}

export const defaultA11yConfig: AccessibilityConfig = {
  reducedMotion: false,
  highContrast: false,
  screenReaderAnnouncements: true,
  keyboardShortcuts: true,
  focusIndicators: 'standard',
  textSize: 'medium',
};

export const KEYBOARD_SHORTCUTS = {
  NEW_WORKOUT: 'n',
  START_WORKOUT: 's',
  SAVE_WORKOUT: 'Control+s',
  SEARCH: '/',
  HELP: '?',
  NAVIGATION_NEXT: 'j',
  NAVIGATION_PREVIOUS: 'k',
} as const;

export const TEXT_SIZE_MULTIPLIERS = {
  small: 0.875,
  medium: 1,
  large: 1.125,
  xlarge: 1.25,
} as const;
