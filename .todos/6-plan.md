# Issue #6: Homepage Enhancement

**Branch:** `issue-6-homepage`
**Repo:** dazz_site
**Status:** COMPLETE
**Dependencies:** #1 (complete), #2 (complete), #3 (complete), #5 (complete)

## Acceptance Criteria

- [ ] Featured picks section (top 4 from API, reusing PickCard)
- [ ] Latest YouTube video embed (from product `video_url` field)
- [ ] Empty state fallback when no products exist
- [ ] Category navigation cards (already exist)
- [ ] About/bio section (already exists)
- [ ] Newsletter CTA (already in footer from #5)

## Current State

The homepage (`src/pages/index.astro`) is a 65-line static page with:
- Hero section with tagline + CTAs (See My Picks, Watch on YouTube) ✓
- Category quick links (4 cards: Mice, Keyboards, Mousepads, IEMs) ✓
- About section with bio + social links ✓
- Newsletter in persistent footer (from #5) ✓
- **Zero API calls** — fully static placeholder

## Key Decisions

### Featured Picks Selection
- Call `getProducts()` once, derive picks by filtering `p.pick_category`
- Take first 4 picks (picks are already curated in the CRM, ordering is intentional)
- Reuse `PickCard` component from issue #4

### YouTube Video Embed
- Find the most recent product with a `video_url` (sort by `date_acquired` descending)
- Parse YouTube URL to extract video ID (support `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/shorts/`)
- Embed via iframe with `youtube-nocookie.com` for privacy
- Helper function: inline in `index.astro` frontmatter (no separate utility file — YAGNI)

### Single API Call
- `getProducts()` returns all products — derive picks and latest video from the same array
- Avoids duplicate API calls (picks page calls `getPicks()` which internally calls `getProducts()`)

### Section Order
1. Hero (existing)
2. Featured Picks (NEW) — or empty state if no picks
3. Latest Video (NEW) — only shown if a video URL exists
4. Categories (existing)
5. About (existing)

### Empty State
- If no products at all: replace Featured Picks with EmptyState ("Reviews coming soon — subscribe for updates")
- If products exist but no picks: skip Featured Picks section entirely
- If no video_url on any product: skip Latest Video section entirely
- Categories and About always render (they're static)

## Implementation Steps

### 1. Add API imports and data fetching to frontmatter

Add imports for `getProducts`, `PickCard`, `EmptyState` and the Product type. Call `getProducts()` once. Derive:
- `picks`: filter by `pick_category`, take first 4
- `latestVideo`: find most recent product with a `video_url`, extract YouTube video ID
- `hasProducts`: boolean for empty state logic

### 2. Add YouTube video ID parser

Inline function in frontmatter that extracts a YouTube video ID from common URL formats:
- `youtube.com/watch?v=ID`
- `youtu.be/ID`
- `youtube.com/embed/ID`
- `youtube.com/shorts/ID`

Returns `string | null`.

### 3. Add Featured Picks section

Between Hero and Categories:
- If `hasProducts && picks.length > 0`: render section with heading "Featured Picks", 4-column grid of PickCard components, and a "See All Picks →" link
- If `!hasProducts`: render EmptyState with title "Reviews coming soon" and newsletter CTA suggestion
- If `hasProducts && picks.length === 0`: skip section (products exist but none are designated as picks yet)

### 4. Add Latest Video section

Between Featured Picks and Categories:
- Only render if `latestVideo` exists (video ID + product name)
- Responsive 16:9 iframe embed using `youtube-nocookie.com`
- Show product name as heading: "Latest Review: {productName}"
- `loading="lazy"` on iframe for performance

### 5. Verify build

- `npx astro build` — all 8 pages render
- Test with and without API available (graceful empty state)

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/index.astro` | Add API data fetching, Featured Picks, Latest Video, empty state |

No new files needed. No new components — reuses PickCard and EmptyState.

## Edge Cases

- No products from API: empty state with newsletter CTA
- Products exist but no picks: skip featured picks section
- No video URLs: skip video section
- Invalid/unparseable video URL: skip video section (return null from parser)
- Video URL is not YouTube (e.g., Twitch): parser returns null, section skipped
- All fields render safely with Astro's auto-escaping

## Progress Log

- 2026-02-09: Plan created from codebase + learnings research
- 2026-02-09: Implementation complete, build passes (8 pages)
- 2026-02-09: Code review (Security + Edge Case), applied 4 fixes
- 2026-02-09: Merged to main at 3d39761, issue #6 closed
