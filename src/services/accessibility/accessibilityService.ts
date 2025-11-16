import { AccessibilityConfig, defaultA11yConfig, TEXT_SIZE_MULTIPLIERS } from '@/config/accessibility';
import { supabase } from '@/integrations/supabase/client';

/**
 * Save accessibility preferences for a user
 */
export async function saveA11yPreferences(
  userId: string,
  config: AccessibilityConfig
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      accessibility_config: config,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error saving accessibility preferences:', error);
    throw error;
  }

  // Apply settings immediately
  applyA11ySettings(config);
}

/**
 * Get accessibility preferences for a user
 */
export async function getA11yPreferences(
  userId: string
): Promise<AccessibilityConfig> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('accessibility_config')
    .eq('user_id', userId)
    .single();

  if (error || !data?.accessibility_config) {
    // Return default config if not found
    return defaultA11yConfig;
  }

  return data.accessibility_config as AccessibilityConfig;
}

/**
 * Announce a message to screen readers using ARIA live regions
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the live region
  let liveRegion = document.querySelector(`[aria-live="${priority}"][data-a11y-announcer="true"]`);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('data-a11y-announcer', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Clear and set message (this triggers the announcement)
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
}

/**
 * Apply accessibility settings to the document
 */
export function applyA11ySettings(config: AccessibilityConfig): void {
  const root = document.documentElement;

  // Reduced motion
  if (config.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // High contrast
  if (config.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Focus indicators
  root.setAttribute('data-focus-style', config.focusIndicators);

  // Text size
  const multiplier = TEXT_SIZE_MULTIPLIERS[config.textSize];
  root.style.fontSize = `${multiplier * 16}px`;

  // Store in localStorage for quick access
  localStorage.setItem('a11y-config', JSON.stringify(config));
}

/**
 * Detect user's system accessibility preferences
 */
export function detectUserPreferences(): Partial<AccessibilityConfig> {
  const preferences: Partial<AccessibilityConfig> = {};

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preferences.reducedMotion = true;
  }

  // Check for high contrast preference
  if (window.matchMedia('(prefers-contrast: high)').matches) {
    preferences.highContrast = true;
  }

  return preferences;
}

/**
 * Get cached accessibility config from localStorage
 */
export function getCachedA11yConfig(): AccessibilityConfig | null {
  try {
    const cached = localStorage.getItem('a11y-config');
    if (cached) {
      return JSON.parse(cached) as AccessibilityConfig;
    }
  } catch (error) {
    console.error('Error reading cached a11y config:', error);
  }
  return null;
}
