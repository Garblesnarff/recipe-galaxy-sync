/**
 * Site-Specific Configuration
 * Manages timeouts, rate limits, and other settings per domain
 */

export interface SiteConfig {
  domain: string;
  timeout: number;              // Request timeout in ms
  retryAttempts: number;        // Number of retry attempts
  rateLimitDelay: number;       // Minimum delay between requests
  rateLimitMaxRequests: number; // Max requests per window
  rateLimitWindow: number;      // Rate limit window in ms
  useCircuitBreaker: boolean;   // Enable circuit breaker
  circuitBreakerThreshold: number; // Failures before opening circuit
  preferredMethod: 'standard' | 'enhanced' | 'firecrawl'; // Preferred scraping method
  userAgentRotation: boolean;   // Rotate user agents
  requiresJavaScript: boolean;  // Site requires JS rendering
  difficulty: 'easy' | 'medium' | 'hard'; // Scraping difficulty
  notes?: string;               // Additional notes
}

/**
 * Default configuration for unknown sites
 */
const DEFAULT_CONFIG: Omit<SiteConfig, 'domain'> = {
  timeout: 30000,              // 30 seconds
  retryAttempts: 3,
  rateLimitDelay: 1000,        // 1 second
  rateLimitMaxRequests: 10,
  rateLimitWindow: 60000,      // 1 minute
  useCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  preferredMethod: 'standard',
  userAgentRotation: true,
  requiresJavaScript: false,
  difficulty: 'medium'
};

/**
 * Site-specific configurations
 */
const SITE_CONFIGS: Record<string, Partial<SiteConfig>> = {
  // Easy sites - work well with standard scraping
  'allrecipes.com': {
    difficulty: 'easy',
    timeout: 20000,
    retryAttempts: 2,
    preferredMethod: 'standard',
    notes: 'Very reliable, good schema.org markup'
  },

  'simplyrecipes.com': {
    difficulty: 'easy',
    timeout: 20000,
    preferredMethod: 'standard',
    notes: 'Clean HTML structure, reliable'
  },

  'food.com': {
    difficulty: 'easy',
    timeout: 20000,
    preferredMethod: 'standard',
    notes: 'Good structured data'
  },

  'cooking.nytimes.com': {
    difficulty: 'medium',
    timeout: 25000,
    preferredMethod: 'standard',
    notes: 'May require subscription for some recipes'
  },

  // Medium difficulty sites
  'bonappetit.com': {
    difficulty: 'medium',
    timeout: 25000,
    retryAttempts: 3,
    preferredMethod: 'enhanced',
    requiresJavaScript: true,
    notes: 'Dynamic content loading'
  },

  'epicurious.com': {
    difficulty: 'medium',
    timeout: 25000,
    preferredMethod: 'enhanced',
    requiresJavaScript: true,
    notes: 'Complex page structure'
  },

  'tasteofhome.com': {
    difficulty: 'medium',
    timeout: 25000,
    preferredMethod: 'enhanced',
    notes: 'Heavy with ads, may be slow'
  },

  // Challenging sites
  'foodnetwork.com': {
    difficulty: 'hard',
    timeout: 30000,
    retryAttempts: 4,
    rateLimitDelay: 2000,
    rateLimitMaxRequests: 5,
    preferredMethod: 'enhanced',
    requiresJavaScript: true,
    circuitBreakerThreshold: 3,
    notes: 'Dynamic content, complex structure, may block scrapers'
  },

  'hellofresh.com': {
    difficulty: 'hard',
    timeout: 35000,
    retryAttempts: 5,
    rateLimitDelay: 3000,
    rateLimitMaxRequests: 3,
    preferredMethod: 'firecrawl',
    requiresJavaScript: true,
    circuitBreakerThreshold: 3,
    notes: 'Very challenging, requires authentication for most recipes, heavy JS'
  },

  'tasty.co': {
    difficulty: 'hard',
    timeout: 30000,
    preferredMethod: 'enhanced',
    requiresJavaScript: true,
    notes: 'Video-centric, JSON data in scripts'
  },

  'delish.com': {
    difficulty: 'medium',
    timeout: 25000,
    preferredMethod: 'enhanced',
    notes: 'Heavy with ads and popups'
  },

  'seriouseats.com': {
    difficulty: 'easy',
    timeout: 20000,
    preferredMethod: 'standard',
    notes: 'Detailed recipes, good markup'
  },

  'thekitchn.com': {
    difficulty: 'easy',
    timeout: 20000,
    preferredMethod: 'standard',
    notes: 'Clean structure, reliable'
  }
};

/**
 * Get configuration for a domain
 */
export function getSiteConfig(url: string): SiteConfig {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');

    // Check for exact match
    if (SITE_CONFIGS[domain]) {
      return {
        domain,
        ...DEFAULT_CONFIG,
        ...SITE_CONFIGS[domain]
      };
    }

    // Check for partial matches (e.g., subdomain.example.com matches example.com)
    for (const [configDomain, config] of Object.entries(SITE_CONFIGS)) {
      if (domain.endsWith(configDomain)) {
        return {
          domain,
          ...DEFAULT_CONFIG,
          ...config
        };
      }
    }

    // Return default config for unknown domains
    return {
      domain,
      ...DEFAULT_CONFIG
    };

  } catch (error) {
    console.error('Error parsing URL for config:', error);
    return {
      domain: 'unknown',
      ...DEFAULT_CONFIG
    };
  }
}

/**
 * Get timeout for a specific domain
 */
export function getTimeout(url: string): number {
  return getSiteConfig(url).timeout;
}

/**
 * Get retry attempts for a specific domain
 */
export function getRetryAttempts(url: string): number {
  return getSiteConfig(url).retryAttempts;
}

/**
 * Get rate limit configuration for a domain
 */
export function getRateLimitConfig(url: string): {
  maxRequests: number;
  windowMs: number;
  minDelay: number;
} {
  const config = getSiteConfig(url);
  return {
    maxRequests: config.rateLimitMaxRequests,
    windowMs: config.rateLimitWindow,
    minDelay: config.rateLimitDelay
  };
}

/**
 * Get circuit breaker configuration for a domain
 */
export function getCircuitBreakerConfig(url: string): {
  enabled: boolean;
  failureThreshold: number;
} {
  const config = getSiteConfig(url);
  return {
    enabled: config.useCircuitBreaker,
    failureThreshold: config.circuitBreakerThreshold
  };
}

/**
 * Get preferred scraping method for a domain
 */
export function getPreferredMethod(url: string): 'standard' | 'enhanced' | 'firecrawl' {
  return getSiteConfig(url).preferredMethod;
}

/**
 * Check if domain is known to be challenging
 */
export function isChallengingSite(url: string): boolean {
  const config = getSiteConfig(url);
  return config.difficulty === 'hard';
}

/**
 * Check if domain requires JavaScript rendering
 */
export function requiresJavaScript(url: string): boolean {
  return getSiteConfig(url).requiresJavaScript;
}

/**
 * Get all configured domains
 */
export function getAllConfiguredDomains(): string[] {
  return Object.keys(SITE_CONFIGS);
}

/**
 * Get configuration summary for monitoring
 */
export function getConfigSummary(): {
  totalDomains: number;
  byDifficulty: Record<string, number>;
  byPreferredMethod: Record<string, number>;
} {
  const domains = Object.entries(SITE_CONFIGS);
  const byDifficulty: Record<string, number> = {};
  const byPreferredMethod: Record<string, number> = {};

  for (const [_, config] of domains) {
    const difficulty = config.difficulty || 'medium';
    const method = config.preferredMethod || 'standard';

    byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1;
    byPreferredMethod[method] = (byPreferredMethod[method] || 0) + 1;
  }

  return {
    totalDomains: domains.length,
    byDifficulty,
    byPreferredMethod
  };
}

/**
 * Generate user agent based on site requirements
 */
export function getUserAgent(url: string): string {
  const config = getSiteConfig(url);

  const userAgents = {
    standard: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    mobile: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36'
    ]
  };

  // Some sites work better with mobile user agents
  const useMobile = config.requiresJavaScript && config.difficulty === 'hard';
  const pool = useMobile ? userAgents.mobile : userAgents.standard;

  if (config.userAgentRotation) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return pool[0];
}
