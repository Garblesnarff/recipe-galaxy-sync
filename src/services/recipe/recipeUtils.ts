/**
 * Utility functions for recipe services
 */

import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

export interface SiteCompatibility {
  category: 'reliable' | 'challenging' | 'unknown';
  supported: boolean;
  icon: typeof CheckCircle;
  message: string;
  estimatedTime?: string;
}

/**
 * Validates whether a string is a valid URL
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Function to extract domain from URL for error handling
 */
export const getDomain = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace('www.', '');
  } catch {
    return "";
  }
};

/**
 * Checks if a URL is a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Get compatibility information for a recipe website
 */
export const getSiteCompatibility = (domain: string): SiteCompatibility => {
  // Sites that work reliably with our scrapers
  const reliableSites = [
    'allrecipes.com',
    'simplyrecipes.com',
    'damndelicious.com',
    'food.com',
    'cooking.nytimes.com',
    'beefitswhatsfordinner.com',
    'pinchofyum.com',
    'onceuponachef.com'
  ];

  // Sites that need enhanced scraping but are supported
  const challengingSites = [
    'foodnetwork.com',
    'hellofresh.com',
    'epicurious.com',
    'bonappetit.com',
    'tasteofhome.com'
  ];

  const lowerDomain = domain.toLowerCase();

  if (reliableSites.some(site => lowerDomain.includes(site))) {
    return {
      category: 'reliable',
      supported: true,
      icon: CheckCircle,
      message: 'This site works great with our importer!',
      estimatedTime: '10-20 seconds'
    };
  }

  if (challengingSites.some(site => lowerDomain.includes(site))) {
    return {
      category: 'challenging',
      supported: true,
      icon: AlertTriangle,
      message: 'This site may take longer - we use advanced techniques to extract recipes.',
      estimatedTime: '20-45 seconds'
    };
  }

  // Unknown sites - we'll try our best
  return {
    category: 'unknown',
    supported: true,
    icon: Clock,
    message: 'Unknown site - we\'ll try multiple extraction methods.',
    estimatedTime: '15-60 seconds'
  };
};

/**
 * Sites that are truly not supported (no extraction possible)
 */
export const getUnsupportedSites = (): string[] => {
  return [
    // Add sites here that have technical barriers we can't overcome
    // (e.g., require login, no structured data, actively block scraping)
  ];
};

/**
 * Check if a domain is truly unsupported (not just challenging)
 */
export const isUnsupportedSite = (domain: string): boolean => {
  const unsupportedSites = getUnsupportedSites();
  return unsupportedSites.some(site => domain.toLowerCase().includes(site));
};
