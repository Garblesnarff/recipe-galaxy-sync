export {
  saveA11yPreferences,
  getA11yPreferences,
  announceToScreenReader,
  applyA11ySettings,
  detectUserPreferences,
  getCachedA11yConfig,
} from './accessibilityService';

export {
  getKeyboardFocusableElements,
  trapFocus,
  restoreFocus,
  moveFocusToFirstError,
  skipToContent,
  FocusTrap,
} from './focusManagement';

export {
  KeyboardShortcutManager,
  getShortcutManager,
  destroyShortcutManager,
} from './keyboardShortcuts';

export type { ShortcutHandler } from './keyboardShortcuts';
