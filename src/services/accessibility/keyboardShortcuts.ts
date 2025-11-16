/**
 * Keyboard Shortcuts Manager for Accessibility
 */

export interface ShortcutHandler {
  key: string;
  handler: () => void;
  description: string;
  category?: string;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, ShortcutHandler> = new Map();
  private isEnabled: boolean = true;
  private listener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.listener = this.handleKeyPress.bind(this);
    this.attachListener();
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(shortcut: ShortcutHandler): void {
    const normalizedKey = this.normalizeKey(shortcut.key);
    this.shortcuts.set(normalizedKey, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key: string): void {
    const normalizedKey = this.normalizeKey(key);
    this.shortcuts.delete(normalizedKey);
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): ShortcutHandler[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): ShortcutHandler[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  /**
   * Enable or disable keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Handle keyboard events
   */
  handleKeyPress(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Don't intercept if user is typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Exception: Allow some shortcuts even in input fields
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
    }

    const pressedKey = this.getKeyFromEvent(event);
    const shortcut = this.shortcuts.get(pressedKey);

    if (shortcut) {
      event.preventDefault();
      shortcut.handler();
    }
  }

  /**
   * Attach the keyboard event listener
   */
  private attachListener(): void {
    if (this.listener) {
      document.addEventListener('keydown', this.listener);
    }
  }

  /**
   * Detach the keyboard event listener
   */
  detachListener(): void {
    if (this.listener) {
      document.removeEventListener('keydown', this.listener);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.detachListener();
    this.shortcuts.clear();
  }

  /**
   * Normalize a key string for consistent comparison
   */
  private normalizeKey(key: string): string {
    return key.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Get the normalized key string from a keyboard event
   */
  private getKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('control');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');

    const key = event.key.toLowerCase();
    parts.push(key);

    return this.normalizeKey(parts.join('+'));
  }
}

// Global singleton instance
let globalShortcutManager: KeyboardShortcutManager | null = null;

/**
 * Get the global keyboard shortcut manager instance
 */
export function getShortcutManager(): KeyboardShortcutManager {
  if (!globalShortcutManager) {
    globalShortcutManager = new KeyboardShortcutManager();
  }
  return globalShortcutManager;
}

/**
 * Clean up the global keyboard shortcut manager
 */
export function destroyShortcutManager(): void {
  if (globalShortcutManager) {
    globalShortcutManager.destroy();
    globalShortcutManager = null;
  }
}
