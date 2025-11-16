import { useEffect, useState } from 'react';
import { detectSystemTheme, watchSystemTheme } from '@/services/theme/themeService';

interface UseSystemThemeOptions {
  autoApply?: boolean;
}

export function useSystemTheme(options: UseSystemThemeOptions = {}) {
  const { autoApply = false } = options;
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => detectSystemTheme());

  useEffect(() => {
    // Watch for system theme changes
    const cleanup = watchSystemTheme((newTheme) => {
      setSystemTheme(newTheme);
    });

    return cleanup;
  }, []);

  return {
    systemTheme,
    prefersDark: systemTheme === 'dark',
    prefersLight: systemTheme === 'light',
  };
}
