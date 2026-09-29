/**
 * Extracts YouTube Video ID from any format on the client side:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://youtube.com/live/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - Direct 11-char Video ID
 * - Links with extra parameters (?si=..., &t=..., &list=..., &feature=...)
 * - URLs embedded in text or <iframe> tags
 */
export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  let str = input.trim();

  // If input is an iframe or HTML string, extract src attribute
  const srcMatch = str.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    str = srcMatch[1];
  }

  // If input contains text surrounding a URL (e.g. "Watch on YouTube: https://youtu.be/xxx")
  const urlInTextMatch = str.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlInTextMatch && urlInTextMatch[0]) {
    str = urlInTextMatch[0];
  }

  // 1. If it's already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // 2. Decode URL if it has encoded components (e.g. attribution_link)
  try {
    if (str.includes('%2F') || str.includes('%3F') || str.includes('%3D')) {
      const decoded = decodeURIComponent(str);
      const sub = extractYouTubeId(decoded);
      if (sub) return sub;
    }
  } catch {}

  // 3. Structured URL parsing
  try {
    const urlObj = new URL(str.startsWith('http://') || str.startsWith('https://') ? str : 'https://' + str);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const pathId = urlObj.pathname.slice(1).split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(pathId)) {
        return pathId;
      }
    }

    // youtube.com, m.youtube.com, music.youtube.com, youtube-nocookie.com
    if (hostname.includes('youtube.com') || hostname.includes('youtube-nocookie.com')) {
      // Check query param v=
      const v = urlObj.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }

      // Check path routes: /embed/ID, /shorts/ID, /live/ID, /v/ID, /e/ID
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const actionIndex = pathSegments.findIndex(seg => 
        ['embed', 'shorts', 'live', 'v', 'e'].includes(seg.toLowerCase())
      );
      if (actionIndex !== -1 && pathSegments[actionIndex + 1]) {
        const candidate = pathSegments[actionIndex + 1].split('?')[0].split('&')[0];
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
          return candidate;
        }
      }
    }
  } catch {}

  // 4. Regex fallback patterns
  const patterns = [
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/|e\/))([\w-]{11})/i,
    /[?&]v=([\w-]{11})/i,
    /\/([\w-]{11})(?:[?&#/]|$)/
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
      return match[1];
    }
  }

  return null;
}
