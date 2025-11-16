import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityConfig, defaultA11yConfig } from '@/config/accessibility';
import {
  saveA11yPreferences,
  getA11yPreferences,
  announceToScreenReader,
  applyA11ySettings,
  getCachedA11yConfig,
} from '@/services/accessibility/accessibilityService';
import { useAuth } from '@/hooks/useAuth';

interface A11yContextValue {
  a11yConfig: AccessibilityConfig;
  updateA11yConfig: (config: Partial<AccessibilityConfig>) => Promise<void>;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const A11yContext = createContext<A11yContextValue | undefined>(undefined);

export function A11yProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [a11yConfig, setA11yConfig] = useState<AccessibilityConfig>(() => {
    // Try to load from cache first
    return getCachedA11yConfig() || defaultA11yConfig;
  });

  // Load user preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (userId) {
        try {
          const config = await getA11yPreferences(userId);
          setA11yConfig(config);
          applyA11ySettings(config);
        } catch (error) {
          console.error('Error loading accessibility preferences:', error);
        }
      }
    };

    loadPreferences();
  }, [userId]);

  // Apply settings whenever config changes
  useEffect(() => {
    applyA11ySettings(a11yConfig);
  }, [a11yConfig]);

  const updateA11yConfig = async (partialConfig: Partial<AccessibilityConfig>) => {
    const newConfig = { ...a11yConfig, ...partialConfig };
    setA11yConfig(newConfig);

    if (userId) {
      await saveA11yPreferences(userId, newConfig);
    }
  };

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (a11yConfig.screenReaderAnnouncements) {
      announceToScreenReader(message, priority);
    }
  };

  return (
    <A11yContext.Provider value={{ a11yConfig, updateA11yConfig, announce }}>
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within A11yProvider');
  }
  return context;
}
