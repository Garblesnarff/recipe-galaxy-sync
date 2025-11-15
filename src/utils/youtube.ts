/**
 * YouTube Utility Functions
 * Provides helper functions for handling YouTube video URLs and metadata
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * @param url - YouTube URL or video ID
 * @returns Video ID (11 characters) or null if invalid
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    // Handle different YouTube URL formats
    const patterns = [
      // Standard watch URL: youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      // Short URL: youtu.be/VIDEO_ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // Embed URL: youtube.com/embed/VIDEO_ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // Mobile URL: m.youtube.com/watch?v=VIDEO_ID
      /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      // Direct video ID (11 characters)
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a URL is a valid YouTube URL
 *
 * @param url - URL to validate
 * @returns True if valid YouTube URL, false otherwise
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Generate YouTube thumbnail URL for a video
 * Quality options:
 * - 'default': 120x90
 * - 'hq': 480x360 (high quality)
 * - 'sd': 640x480 (standard definition)
 * - 'maxres': 1280x720 (maximum resolution)
 *
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default: 'hq')
 * @returns Thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'hq' | 'sd' | 'maxres' = 'hq'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Validate YouTube URL and extract video ID
 *
 * @param url - YouTube URL to validate
 * @returns Validation result with error message and video ID if valid
 */
export function validateYouTubeUrl(url: string): {
  valid: boolean;
  error?: string;
  videoId?: string;
} {
  if (!url) {
    return {
      valid: false,
      error: 'URL is required',
    };
  }

  if (typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL must be a string',
    };
  }

  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return {
      valid: false,
      error: 'Invalid YouTube URL. Please provide a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)',
    };
  }

  return {
    valid: true,
    videoId,
  };
}
