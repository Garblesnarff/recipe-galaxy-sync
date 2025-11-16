import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, getThemeById, getAllThemes, DEFAULT_THEME } from '@/config/themes';
import { applyTheme, getThemePreference, saveThemePreference } from '@/services/theme/themeService';
import { useAuth } from '@/contexts/AuthContext';

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (themeId: string) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
  isHighContrast: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    async function loadTheme() {
      const preferredTheme = await getThemePreference(user?.id || null);
      setThemeId(preferredTheme);
      applyTheme(preferredTheme);
      setIsLoading(false);
    }

    loadTheme();
  }, [user?.id]);

  // Apply theme when it changes
  useEffect(() => {
    if (!isLoading) {
      applyTheme(themeId);
    }
  }, [themeId, isLoading]);

  const setTheme = async (newThemeId: string) => {
    setThemeId(newThemeId);
    if (user?.id) {
      await saveThemePreference(user.id, newThemeId);
    } else {
      localStorage.setItem('theme-preference', newThemeId);
    }
  };

  const toggleTheme = () => {
    const newThemeId = themeId === 'light' ? 'dark' : 'light';
    setTheme(newThemeId);
  };

  const theme = getThemeById(themeId) || getThemeById(DEFAULT_THEME)!;
  const availableThemes = getAllThemes();
  const isHighContrast = theme.contrastRatio === 'high' || theme.contrastRatio === 'extra-high';

  const value: ThemeContextType = {
    theme,
    themeId,
    setTheme,
    toggleTheme,
    availableThemes,
    isHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
