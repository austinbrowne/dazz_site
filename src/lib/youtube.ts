/** YouTube video IDs are 11 characters of [A-Za-z0-9_-] */
export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Privacy-enhanced embed base URL */
export const YOUTUBE_EMBED_BASE = 'https://www.youtube-nocookie.com/embed/';

/** Sandbox attributes for YouTube iframes */
export const YOUTUBE_IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-popups';

/** Extract a YouTube video ID from common URL formats. Returns null if not a recognized YouTube URL. */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    let id: string | null = null;

    if (['youtube.com', 'youtube-nocookie.com', 'm.youtube.com'].includes(host)) {
      // /watch?v=ID
      const v = parsed.searchParams.get('v');
      if (v) id = v;
      // /embed/ID, /shorts/ID, or /live/ID
      if (!id) {
        const match = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
        if (match) id = match[2];
      }
    } else if (host === 'youtu.be') {
      id = parsed.pathname.slice(1).split('/')[0] || null;
    }

    return id && YOUTUBE_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}
