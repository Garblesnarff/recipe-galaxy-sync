
/**
 * Utility functions for recipe services
 */

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
