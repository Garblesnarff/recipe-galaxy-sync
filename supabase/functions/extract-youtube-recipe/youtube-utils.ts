
/**
 * Extracts a YouTube video ID from different URL formats
 * @param url - The YouTube URL
 * @returns The video ID or empty string if not found
 */
export const extractVideoId = (url: string): string => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu.be\/)([^&\n?#]+)/,
    /(?:youtube.com\/shorts\/)([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
};

/**
 * Fetches video metadata from YouTube's oEmbed API
 * @param videoId - The YouTube video ID
 * @returns The video metadata including title and thumbnail URL
 */
export async function fetchVideoMetadata(videoId: string) {
  console.log('Fetching video metadata...');
  const oembedResponse = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  );

  if (!oembedResponse.ok) {
    console.error('Failed to fetch video metadata, status:', oembedResponse.status);
    throw new Error('Failed to fetch video metadata');
  }

  const metadata = await oembedResponse.json();
  console.log('Fetched metadata:', JSON.stringify(metadata));
  return metadata;
}
