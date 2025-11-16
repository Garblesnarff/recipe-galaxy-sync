import { useEffect, useRef } from 'react';
import {
  ShortcutHandler,
  getShortcutManager,
} from '@/services/accessibility/keyboardShortcuts';
import { useA11y } from '@/hooks/useA11y';

/**
 * Hook to register keyboard shortcuts
 * Automatically unregisters when component unmounts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const { a11yConfig } = useA11y();
  const shortcutManager = getShortcutManager();
  const registeredKeysRef = useRef<string[]>([]);

  useEffect(() => {
    // Only register if keyboard shortcuts are enabled
    if (!a11yConfig.keyboardShortcuts) {
      return;
    }

    // Register all shortcuts
    shortcuts.forEach((shortcut) => {
      shortcutManager.registerShortcut(shortcut);
      registeredKeysRef.current.push(shortcut.key);
    });

    // Cleanup: unregister shortcuts when component unmounts
    return () => {
      registeredKeysRef.current.forEach((key) => {
        shortcutManager.unregisterShortcut(key);
      });
      registeredKeysRef.current = [];
    };
  }, [shortcuts, a11yConfig.keyboardShortcuts]);

  return shortcutManager;
}
