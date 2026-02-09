---
title: "YouTube Embed URL Parsing and Video ID Validation"
category: "frontend"
tags: ["youtube", "iframe", "security", "video-embed", "url-parsing"]
severity: "medium"
date: "2026-02-09"
---

# YouTube Embed URL Parsing and Video ID Validation

## Problem

Embedding YouTube videos from user/CRM-provided URLs requires parsing multiple URL formats and validating the extracted video ID before interpolating it into an iframe `src` attribute. Unvalidated IDs can redirect the iframe to unintended paths on the embed domain.

## Root Cause

YouTube URLs come in 6+ formats: `youtube.com/watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, `/live/`, and `m.youtube.com`. A naive parser that only handles one format will silently skip valid videos. Additionally, `searchParams.get('v')` returns arbitrary strings that may contain path-traversal characters.

## Solution

1. Parse the URL with `new URL()` inside a try/catch (handles malformed URLs)
2. Check hostname against an allowlist (`youtube.com`, `m.youtube.com`, `youtube-nocookie.com`, `youtu.be`)
3. Extract the video ID from the appropriate location (query param or path segment)
4. **Validate the ID format**: YouTube IDs are always 11 characters of `[A-Za-z0-9_-]`
5. Use `youtube-nocookie.com` in the embed iframe for privacy
6. Add `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"` to the iframe

```typescript
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    let id: string | null = null;

    if (['youtube.com', 'youtube-nocookie.com', 'm.youtube.com'].includes(host)) {
      const v = parsed.searchParams.get('v');
      if (v) id = v;
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
```

## Key Insight

The 11-character regex validation is the critical defense. Without it, a crafted URL like `youtube.com/watch?v=../../evil` would produce a valid-looking but dangerous embed URL. Astro's template escaping prevents XSS, but the regex prevents path manipulation on the embed domain.

## Prevention

- Always validate video IDs with the 11-char regex before embedding
- Use `youtube-nocookie.com` for privacy-enhanced embeds
- Add `sandbox` attribute to iframes to restrict embedded content permissions
- If the parser returns null, skip the video section entirely (graceful degradation)
