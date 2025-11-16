import { useState, useEffect } from 'react';
import { useA11y } from '@/hooks/useA11y';

/**
 * Hook to determine if reduced motion is preferred
 * Checks both app settings and system preferences
 */
export function useReducedMotion(): boolean {
  const { a11yConfig } = useA11y();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Return true if either app setting or system preference indicates reduced motion
  return a11yConfig.reducedMotion || prefersReducedMotion;
}
