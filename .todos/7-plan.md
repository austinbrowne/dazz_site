# Issue #7: Brand Partnership / Work With Me Page

**Branch:** `issue-7-work-with-me`
**Repo:** dazz_site
**Status:** COMPLETE
**Dependencies:** #1 (complete), #2 (complete)

## Acceptance Criteria

- [ ] Sections: About (with content niches), Audience Stats, Platform Reach, Services Offered, Past Partners, Contact
- [ ] Pull stats from CreatorProfile API endpoint
- [ ] Contact: `mailto:` link (simplest approach per issue spec)
- [ ] Professional but authentic tone
- [ ] Empty state fallback when API is unavailable

## Current State

Placeholder exists at `src/pages/work-with-me.astro` (24 lines):
- BaseLayout wrapper with title/description
- Single heading + intro paragraph
- "Get in Touch" card with Twitter link only
- No API integration, no stats, no services, no partners

## API Data Available

### CreatorProfile (`getCreatorProfile()`)
- `display_name: string` — always present
- `tagline: string | null`
- `bio: string | null`
- `photo_url: string | null`
- `location: string | null`
- `website_url: string | null`
- `social_links: Record<string, string> | null` — e.g. `{ youtube: "url", twitter: "url" }`
- `platform_stats: Record<string, unknown> | null` — loose typing, render generically
- `audience_demographics: Record<string, unknown> | null` — loose typing, render generically
- `content_niches: string[] | null` — e.g. `["gaming mice", "keyboards"]`

### Companies (`getCompanies()`)
- `name`, `category`, `website`, `affiliate_link`, `affiliate_code`
- Filter by `affiliate_link` for Past Partners (actual business relationships only)

## Key Decisions

### Contact Method: `mailto:` Link
- Issue spec says "simple `mailto:` link or Formspree form"
- `mailto:` is simplest, no third-party dependency, no form state management
- Email from `social_links.email` on CreatorProfile, falling back to `CONTACT_EMAIL` constant
- Social links from profile, falling back to `DEFAULT_SOCIAL_LINKS` constant
- Formspree can be added later if needed (separate issue)

### Fallback Constants (FLOW-001, ARCH-002)
- Create `src/lib/constants.ts` with `CONTACT_EMAIL` and `DEFAULT_SOCIAL_LINKS`
- These are the single source of truth for hardcoded contact info across the site
- Values: `business@dazztrazak.com` (or whatever the creator specifies), YouTube + Twitter URLs
- Contact CTA always has actionable methods, even when API is down

### Stats Rendering: Generic Key-Value with `<dl>` (FLOW-005)
- `platform_stats` and `audience_demographics` are `Record<string, unknown>`
- Render as `<dl>` with `<dt>` (label) and `<dd>` (value) for screen reader accessibility
- Helper: `formatStatKey("youtube_subscribers")` → `"YouTube Subscribers"`
  - Brand override map for known names: `{ youtube: "YouTube", twitter: "Twitter", iem: "IEM" }` (FLOW-006)
- Helper: `formatStatValue(125000)` → `"125K"`, `formatStatValue("18-34")` → `"18-34"`
- Skip entries where value is null/undefined or typeof is not string/number (SIMP-001, FLOW-011)
- After filtering, check if any renderable entries remain before rendering section heading (FLOW-003)

### Past Partners: Companies Filtered by affiliate_link (FLOW-008)
- `getCompanies()` filtered to only those with a non-null `affiliate_link`
- Represents actual business relationships, not just reviewed brands
- Display as a grid of company names, linked to website if available
- Sorted alphabetically by name
- Show all companies, no truncation (SIMP-005 — YAGNI)
- If no qualifying companies: skip section entirely

### Page Width: `max-w-4xl`
- Current placeholder uses `max-w-3xl` (too narrow for stats grid)
- Match other content pages, bump to `max-w-4xl`

### No EmptyState Component (ARCH-004)
- Unlike other pages, this page has substantial static content (Services, Contact)
- When API is unavailable, static sections remain useful to brand visitors
- EmptyState is reserved for pages where API data is the primary content

### Section Order
1. Hero/About (name, tagline, bio, photo, content_niches inline)
2. Audience Stats (platform_stats — subscriber/follower counts)
3. Audience Demographics (audience_demographics — age, geography, etc.)
4. Services Offered (static list)
5. Past Partners (companies with affiliate_link from API)
6. Contact CTA (email + social links)

## Implementation Steps

### 0. Create `src/lib/constants.ts`

Define fallback contact info used across the site:
- `CONTACT_EMAIL: string` — business email address
- `DEFAULT_SOCIAL_LINKS: Record<string, string>` — YouTube + Twitter URLs
- Import these in `work-with-me.astro` and eventually consolidate into `index.astro` footer

### 1. Add API imports and data fetching

Add imports for `getCreatorProfile`, `getCompanies`, constants, and types. Fetch in parallel:
```typescript
const [profile, allCompanies] = await Promise.all([getCreatorProfile(), getCompanies()]);
```

Derive:
- `partners`: companies filtered by `affiliate_link`, sorted alphabetically
- `hasProfile`: boolean for conditional rendering
- `console.warn` when profile is null (FLOW-002 — visible in CI logs)

### 2. Add stat formatting helpers

Inline in frontmatter (YAGNI — no separate utility file):
- `formatStatKey(key: string): string` — splits on underscore, applies brand override map, title-cases
- `formatStatValue(value: unknown): string` — numbers get compact formatting (1.2K, 1.5M), strings pass through
- Type guard: skip entries where `typeof value` is not `'string'` or `'number'`

### 3. Rewrite template with all sections

**Hero/About section:**
- Display name as h1, tagline as subtitle
- Bio paragraph (if present)
- Photo (if present) — `<img>` with `w-24 h-24 rounded-full object-cover`, `alt={profile.display_name}`, HTTPS validation (FLOW-004, ARCH-003)
- Location (if present)
- Content niches inline as comma-separated text or small tag pills within the About section (SIMP-002 — folded in, not a standalone section)

**Audience Stats section (platform_stats):**
- Only render if platform_stats has renderable entries after filtering null/non-primitive values
- `<dl>` structure: `<dt>` for label, `<dd>` for value (FLOW-005)
- 2-3 column responsive grid

**Audience Demographics section (audience_demographics):**
- Only render if audience_demographics has renderable entries after filtering
- Same `<dl>` structure as stats
- Visually distinct sub-section with its own heading (SIMP-003)

**Services Offered section:**
- Static content (doesn't come from API)
- 4 service cards: Product Reviews, Sponsored Content, Podcast Features, Affiliate Partnerships
- Each with a short description (placeholder copy, creator can refine)
- Always renders (not API-dependent)

**Past Partners section:**
- Only render if partners array (filtered by affiliate_link) is non-empty
- Simple grid of company names, linked to website if available
- Sorted alphabetically

**Contact CTA section:**
- Card with `mailto:` link (email from profile `social_links.email` or `CONTACT_EMAIL` constant)
- Social links from profile or `DEFAULT_SOCIAL_LINKS` constant
- All external links: `target="_blank" rel="noopener noreferrer"` (FLOW-010)
- Always renders — guaranteed to have actionable contact methods

### 4. Update meta description (FLOW-009)

Change BaseLayout `description` prop to brand-partnership-relevant copy:
"Audience stats, partnership opportunities, and collaboration details for Dazz Trazak."

### 5. Handle empty state

- If `getCreatorProfile()` returns null: `console.warn`, show static sections only
- Services section: always renders (static)
- Contact section: always renders (constant fallbacks guarantee actionable methods)
- Stats/Demographics: skip when no renderable entries after filtering
- Past Partners: skip when no companies with affiliate_link
- Content niches: skip display when null or empty array

### 6. Verify build

- `npx astro build` — all pages render
- Test with API unavailable (empty state: static sections still render with fallback contact)

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/constants.ts` | Fallback contact email + social links (single source of truth) |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/work-with-me.astro` | Full rewrite: API data, all 6 sections, empty state |

## Edge Cases

- No CreatorProfile from API: console.warn + static-only page (Services + Contact with constant fallbacks)
- Profile exists but all optional fields null: show display_name + static sections
- `platform_stats` is `{}` or all values null: skip stats section entirely
- `platform_stats` has objects/arrays/booleans: skip those entries (typeof guard)
- `audience_demographics` empty or all null: skip demographics section
- `social_links` has unknown platform keys: render generically (humanize key name)
- `social_links` is null: fall back to `DEFAULT_SOCIAL_LINKS` constant
- No companies with affiliate_link: skip Past Partners section
- Company with null website: render name without link
- `photo_url` is HTTP (not HTTPS): skip photo (don't render mixed content)
- `photo_url` is null: skip photo entirely
- `content_niches` is null or `[]`: skip display
- Very long bio text: trust CSS `max-w-4xl` + natural paragraph flow
- formatStatKey("youtube_subscribers"): brand override map produces "YouTube Subscribers"

## Progress Log

- 2026-02-08: Plan created from codebase + learnings research
- 2026-02-08: Plan reviewed (spec-flow, architecture, simplicity). Applied 11 findings.
- 2026-02-08: Implementation complete, build passes (8 pages)
- 2026-02-08: Code review (Security + Edge Case), applied 7 fixes
- 2026-02-08: Fresh Eyes Review (8 specialists), applied 6 fixes. 26 dismissed.
- 2026-02-08: Learnings captured (3 solution docs)
- 2026-02-08: Merged to main at d4149d0, issue #7 closed
