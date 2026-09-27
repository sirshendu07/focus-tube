/**
 * Extracts YouTube Video ID from any format:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - VIDEO_ID directly (11 characters)
 */
function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already an 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns for standard, short, embed, shorts, mobile
  const patterns = [
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/)([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /^([\w-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch video details via free YouTube oEmbed API without requiring an API key.
 */
async function fetchYouTubeMetadata(videoId) {
  const defaultMeta = {
    youtubeId: videoId,
    title: `Video (${videoId})`,
    channelTitle: 'YouTube Creator',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  };

  try {
    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'FocusTube/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        youtubeId: videoId,
        title: data.title || defaultMeta.title,
        channelTitle: data.author_name || defaultMeta.channelTitle,
        thumbnailUrl: data.thumbnail_url || defaultMeta.thumbnailUrl
      };
    }
  } catch (err) {
    console.warn(`oEmbed fetch failed for ${videoId}, using default fallback metadata`, err.message);
  }

  return defaultMeta;
}

module.exports = {
  extractYouTubeId,
  fetchYouTubeMetadata
};
