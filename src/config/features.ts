/**
 * Feature Flags Configuration
 *
 * Use environment variables to control feature rollout.
 * This allows gradual rollout, A/B testing, and easy rollback.
 *
 * Usage:
 *   import { FEATURES } from '@/config/features';
 *   if (FEATURES.INFINITE_SCROLL) { ... }
 *
 * Environment Variables:
 *   VITE_FEATURE_INFINITE_SCROLL=true|false
 *   VITE_INFINITE_SCROLL_ROLLOUT_PERCENT=0-100 (for A/B testing)
 *   VITE_PAGINATION_SIZE=20
 *   VITE_ENABLE_PERFORMANCE_MONITORING=true|false
 */

/**
 * Get or create a stable user ID for A/B testing
 * Stored in localStorage to ensure consistent experience
 */
const getUserId = (): string => {
  const key = 'recipe_galaxy_user_id';
  let userId = localStorage.getItem(key);

  if (!userId) {
    // Generate a stable user ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, userId);
  }

  return userId;
};

/**
 * Simple hash function for consistent A/B bucketing
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Determine if user is in A/B test group based on percentage
 * @param percentage - Percentage of users to enable (0-100)
 * @returns true if user is in the enabled group
 */
const isInRolloutGroup = (percentage: number): boolean => {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;

  const userId = getUserId();
  const hash = hashString(userId);
  const bucket = hash % 100;

  return bucket < percentage;
};

/**
 * Calculate if infinite scroll should be enabled
 * Supports both full rollout and percentage-based A/B testing
 */
const getInfiniteScrollEnabled = (): boolean => {
  // Check if explicitly set to true/false
  const explicitValue = import.meta.env.VITE_FEATURE_INFINITE_SCROLL;
  if (explicitValue === 'true') return true;
  if (explicitValue === 'false') return false;

  // Check percentage-based rollout
  const rolloutPercent = parseInt(
    import.meta.env.VITE_INFINITE_SCROLL_ROLLOUT_PERCENT || '0',
    10
  );

  if (rolloutPercent > 0) {
    return isInRolloutGroup(rolloutPercent);
  }

  // Default to false for safe rollout
  return false;
};

export const FEATURES = {
  /**
   * Enable infinite scroll pagination instead of loading all recipes at once
   * Supports A/B testing via rollout percentage
   * Default: false (safe rollout)
   */
  INFINITE_SCROLL: getInfiniteScrollEnabled(),

  /**
   * Number of recipes to load per page when pagination is enabled
   * Default: 20
   */
  PAGINATION_SIZE: parseInt(import.meta.env.VITE_PAGINATION_SIZE || '20', 10),

  /**
   * Enable performance monitoring and logging
   * Default: true in development, false in production
   */
  PERFORMANCE_MONITORING:
    import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' ||
    import.meta.env.DEV,

  /**
   * Enable verbose validation error messages
   * Default: true in development
   */
  VERBOSE_VALIDATION: import.meta.env.DEV,

  /**
   * Enable accessibility debugging tools
   * Default: true in development
   */
  A11Y_DEBUG: import.meta.env.DEV,
} as const;

/**
 * Feature flag utilities
 */
export const FeatureFlags = {
  /**
   * Check if a feature is enabled
   */
  isEnabled: (feature: keyof typeof FEATURES): boolean => {
    return FEATURES[feature] as boolean;
  },

  /**
   * Get all enabled features
   */
  getEnabled: (): string[] => {
    return Object.entries(FEATURES)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  },

  /**
   * Log current feature flag state (development only)
   */
  logState: (): void => {
    if (import.meta.env.DEV) {
      console.group('🚩 Feature Flags');
      Object.entries(FEATURES).forEach(([key, value]) => {
        const emoji = value === true ? '✅' : value === false ? '❌' : '⚙️';
        console.log(`${emoji} ${key}:`, value);
      });

      // Log A/B testing info if applicable
      const rolloutPercent = parseInt(
        import.meta.env.VITE_INFINITE_SCROLL_ROLLOUT_PERCENT || '0',
        10
      );
      if (rolloutPercent > 0 && rolloutPercent < 100) {
        console.log(`🎲 A/B Test: ${rolloutPercent}% rollout`);
        console.log(`👤 User ID: ${getUserId()}`);
      }

      console.groupEnd();
    }
  },

  /**
   * Get user's A/B test group assignment
   */
  getUserId: (): string => {
    return getUserId();
  },

  /**
   * Force reset user ID (for testing)
   * Only works in development
   */
  resetUserId: (): void => {
    if (import.meta.env.DEV) {
      localStorage.removeItem('recipe_galaxy_user_id');
      console.log('🔄 User ID reset. Reload page to get new assignment.');
    }
  },
};
