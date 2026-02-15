# Issue #4: Affiliate Link Hub / My Picks Page

**Branch:** `issue-4-picks-page`
**Repo:** dazz_site
**Status:** IN PROGRESS
**Dependencies:** #1 (complete), #2 (complete), #3 (complete)

## Acceptance Criteria

- [x] `/picks` page with category sections showing top recommendations
- [x] Product cards: image (fallback placeholder), name, price, verdict, affiliate button
- [x] Data from API at build time (`getPicks()` filtered from `getProducts()`)
- [x] Handle missing data: no image -> SVG placeholder, no price -> omit, no affiliate -> "Check Price"
- [x] "Last updated" date for trust
- [x] Responsive grid (mobile-first: 1col, sm:2col, lg:3col)
- [x] AffiliateDisclosure component above cards (FTC)
- [x] Graceful empty state when no picks data available

## Bug Found in Scaffolding

`api.ts:getPicks()` uses `?pick_category=*` which does a literal match for `*` (not wildcard).
Fix: filter products client-side by `pick_category !== null`.

## Implementation Steps

1. Fix `getPicks()` in `api.ts` to properly fetch products with pick_category
2. Create `PickCard.astro` component — product card for picks page
3. Define pick category display order and labels
4. Rewrite `picks.astro` to fetch data, group by pick_category, render sections
5. Handle all empty/missing states

## Progress Log

- 2026-02-08: Branch created, plan written, codebase explored
- 2026-02-08: Fixed getPicks() bug (was literal `*` match, now filters by pick_category != null)
- 2026-02-08: Created PickCard.astro component with image fallback, affiliate link handling
- 2026-02-08: Rewrote picks.astro — category sections, responsive grid, empty state, last updated
- 2026-02-08: Build passes (8 pages, empty state shown when API unavailable)
- 2026-02-08: Review fixes applied — rating falsy check, price formatting, defensive Map.get, type-narrow pick_category, date filter, AffiliateDisclosure placement
