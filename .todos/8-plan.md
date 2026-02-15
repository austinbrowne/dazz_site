# Issue #8: Product Review Database

**Branch:** `issue-8-review-database`
**Repo:** dazz_site
**Status:** PLANNING
**Dependencies:** #1 (complete), #2 (closed), #3 (ongoing backfill), #4-#7 (complete)

## Acceptance Criteria

- [ ] Dynamic route: `/reviews/[category]/[slug].astro` (NOT catch-all)
- [ ] Product page template with all sections (hero, verdict, specs, pros/cons, video, related, affiliate)
- [ ] Category index pages: `/reviews/mice`, `/reviews/keyboards`, `/reviews/mousepads`, `/reviews/iems`
- [ ] Master index: `/reviews` with filters (category, price range, rating) — vanilla JS
- [ ] Empty/missing field handling for all nullable Product fields
- [ ] JSON-LD Product schema for SEO
- [ ] "Reviewed" timestamp per product (FLOW-012: renamed from "Last updated")
- [ ] Related products algorithm (same category + similar price ±30%)
- [ ] Affiliate disclosure above the fold on product pages (FLOW-015: only when affiliate link exists)

## Current State

- `src/pages/reviews/index.astro` — placeholder with EmptyState ("Reviews coming soon")
- No dynamic routes exist anywhere in the codebase
- Homepage links to `/reviews/mice`, `/reviews/keyboards`, `/reviews/mousepads`, `/reviews/iems` (dead links)
- All types defined: `Product`, `ProductSpecs`, `MouseSpecs`, `KeyboardSpecs`, etc.
- All API functions exist: `getProducts()`, `getProductBySlug()`, `getPicks()`
- `extractYouTubeId()` exists in `index.astro` frontmatter (needs extraction to shared utility)
- `AffiliateDisclosure` component exists with `compact` variant
- `PickCard` component exists but fallback link is wrong (`/reviews/${slug}` instead of `/reviews/${category_slug}/${slug}`)
- BaseLayout has no head slot for JSON-LD injection

## Route Structure

```
src/pages/reviews/
  index.astro                      — master catalog with filters
  [category]/
    index.astro                    — category listing (e.g., /reviews/mice)
    [slug].astro                   — individual product page
```

Astro SSG generates static pages via `getStaticPaths()`. Each page gets full product data via props — no per-page API calls at build time.

## Key Decisions

### Build Safety Guard (FLOW-001)
- If `getProducts()` returns an empty array, `getStaticPaths()` logs `console.warn` and returns empty paths
- Cannot `throw` because `getProducts()` returns `[]` for both "API unreachable" and "genuinely no products" — throwing would break local dev builds without API access
- Production empty-deploy protection should be a CI pipeline check (page count assertion), not a build-time exception
- Warning is visible in build output: "API returned 0 products — no product pages will be generated"

### Single API Call Pattern
- Each `getStaticPaths()` calls `getProducts()` once to generate all paths
- Astro SSG caches data fetching per build — even if called from multiple routes, the HTTP request is deduped
- Product data passed via `props` to avoid N+1 API calls
- Related products derived from the full product list at build time

### `other` Category Handling (FLOW-003)
- Products with `category_slug === null` are assigned `"other"` as their category in `getStaticPaths()`
- They get product pages at `/reviews/other/[slug]`
- They are shown on the master `/reviews` index under "Other"
- No dedicated `/reviews/other` category index page (hardcoded in `getStaticPaths` for `[slug].astro` only)
- PickCard links to `/reviews/other/${slug}` for these products

### YouTube Parser Extraction (ARCH-007)
- Move `extractYouTubeId()` and `YOUTUBE_ID_RE` from `index.astro` to `src/lib/youtube.ts`
- Also export `YOUTUBE_EMBED_BASE = 'https://www.youtube-nocookie.com/embed/'` and `YOUTUBE_IFRAME_SANDBOX` constants
- Import in both `index.astro` and `[slug].astro` — single source of truth for security-relevant iframe attributes
- Same validation: 11-char regex, `youtube-nocookie.com` embeds, `sandbox` on iframes

### BaseLayout Head Slot for JSON-LD
- Add `<slot name="head" />` inside `<head>` in `BaseLayout.astro`
- Product pages inject JSON-LD via `<Fragment slot="head"><script type="application/ld+json">...</script></Fragment>`
- Also add optional `ogType` prop (default `"website"`, product pages pass `"product"`)
- Replace hardcoded `content="website"` on the `og:type` meta tag with `content={ogType}` (ARCH-004)
- Non-breaking change: existing pages don't use the slot, so nothing breaks

### PickCard Link Fix (ARCH-005)
- Fix fallback URL from `/reviews/${product.slug}` to `/reviews/${product.category_slug ?? 'other'}/${product.slug}`
- When link is internal (no affiliate, no company website): change CTA text to "Read Review" instead of "Check Price"
- "Check Price" only used when linking to external company website
- "Buy Now" for affiliate links (existing behavior)

### Page Titles and Meta Descriptions (FLOW-010)
- Product page: `title="{product_name} Review"`, `description=short_verdict || "Read our review of {product_name}."`
- Category page: `title="{Category} Reviews — Dazz Trazak"`, `description="Browse our {category} reviews."`
- Master index: keep existing title/description

### Specs Table Rendering (ARCH-001 + SIMP-002)
- Specs logic extracted to `src/lib/specs.ts` (not inline in page frontmatter)
- Auto-generate labels by splitting field keys on `_` and title-casing (reuse `formatStatKey` pattern from Issue #7)
- Flat `SPEC_UNITS: Record<string, string>` map for fields needing units (e.g., `weight: "g"`, `polling_rate: "Hz"`)
- `getSpecEntries(specs, category)` returns `{ label: string; value: string }[]` with nulls filtered
- Defensive formatting: `typeof === 'number' && Number.isFinite()` before numeric display (FLOW-005)
- Format booleans as "Yes"/"No", numbers with units from `SPEC_UNITS`
- Render as `<dl>` with `<dt>` before `<dd>` (learning from Issue #7)
- If no non-null specs: hide the specs section entirely

### Related Products Algorithm (ARCH-002 + SIMP-001)
- Extracted to `src/lib/products.ts` as `getRelatedProducts(current, allProducts, limit?)`
- Simplified algorithm (no price-distance sort):
  1. Filter products: same `category_slug`, exclude current product
  2. If current product has `retail_price > 0`: further filter to ±30% price range
  3. Take first 4 (API order, no sort)
  4. If < 3 matches after price filter: fill with same-category products (up to 4 total)
  5. If 0 same-category products: return empty array (section hidden)
- Render using `PickCard` component (which will have the fixed link)

### Client-Side Filtering (Master Index)
- All products rendered as cards in HTML with `data-category`, `data-price`, `data-rating` attributes
- Filter controls in `<fieldset>` with `<legend>` for accessibility (FLOW-009)
- Category checkboxes, price range dropdown, minimum rating
- Vanilla JS (no framework) using `querySelectorAll` + `data-*` attributes
- Use `data-*` + `querySelectorAll` pattern (not `getElementById` — Astro multi-instance learning)
- Products hidden/shown via CSS class toggle
- `aria-live="polite"` region for product count and "No results" message (FLOW-009)
- Filter state persisted to URL query params via `history.replaceState`; restored on page load (FLOW-011)
- "No results" message when all cards are hidden

### Affiliate Link Validation
- Validate affiliate URLs with `new URL()` in try/catch
- Only render if URL parses successfully and uses `https://` protocol
- If no affiliate link + company has website: "Check Price" button to company website (HTTPS-only)
- If neither: omit the buy button entirely

### Image Fallback (SIMP-005)
- If `image_url` is null or not HTTPS: render the generic SVG placeholder from PickCard pattern
- Single generic placeholder for all categories (consistent with existing PickCard behavior)
- No separate SVG files needed — inline SVG in the template

### JSON-LD Product Schema
- Schema.org `Product` type with `Review` nested
- Fields: name, image, description (short_verdict), brand (company_name), offers (price + affiliate), review (rating)
- Only include fields that have non-null values
- Omit `price` from JSON-LD when `retail_price <= 0` (FLOW-007)
- Inject via `<Fragment slot="head">` into BaseLayout's new head slot

### Breadcrumbs (FLOW-002)
- Product pages: `<nav aria-label="Breadcrumb"><ol>Reviews > {Category} > {Product Name}</ol></nav>`
- Category pages: `<nav aria-label="Breadcrumb"><ol>Reviews > {Category Name}</ol></nav>`
- Last item has `aria-current="page"`
- Placed before hero section on product pages, before heading on category pages

### Rating Accessibility (FLOW-004)
- Rating wrapped with `aria-label="Rating: {rating} out of 10"`
- Color-coded with explicit Tailwind class maps (not dynamic interpolation)

### Price Handling (FLOW-007)
- `const displayPrice = product.retail_price && product.retail_price > 0 ? product.retail_price : null`
- Treat `retail_price <= 0` same as `null` for display, related products, and JSON-LD

## Section Order (Product Page)

1. **Breadcrumb** — `Reviews > Category > Product Name` (FLOW-002)
2. **Product Hero** — image (or generic placeholder), product name, company name, price (if > 0), rating with `aria-label` (FLOW-004), "Buy Now" CTA
3. **Affiliate Disclosure** — `<AffiliateDisclosure />` only when product has affiliate link (FLOW-015)
4. **Quick Verdict** — `short_verdict` text
5. **Specs Table** — via `getSpecEntries()` from `src/lib/specs.ts`
6. **Pros / Cons** — two-column layout, filter empty strings with `.filter(Boolean)` (FLOW-013)
7. **Video Review** — YouTube iframe embed (if video_url exists), using constants from `src/lib/youtube.ts`
8. **Related Products** — grid of PickCards via `getRelatedProducts()` from `src/lib/products.ts`
9. **Reviewed** — `date_acquired` formatted with label "Reviewed" (FLOW-012)

## Implementation Steps

### Step 0: Extract YouTube parser to shared utility

Create `src/lib/youtube.ts` with `extractYouTubeId()`, `YOUTUBE_ID_RE`, `YOUTUBE_EMBED_BASE`, and `YOUTUBE_IFRAME_SANDBOX`.
Update `src/pages/index.astro` to import from the new location.
Build to verify nothing breaks.

### Step 1: Modify BaseLayout

Add `<slot name="head" />` inside `<head>` in `BaseLayout.astro`.
Add optional `ogType` prop (default `"website"`).
Replace hardcoded `content="website"` on `og:type` meta tag with `content={ogType}`.
Build to verify existing pages still work (non-breaking).

### Step 2: Fix PickCard fallback link

Change fallback from `/reviews/${product.slug}` to `/reviews/${product.category_slug ?? 'other'}/${product.slug}`.
Change link text to "Read Review" when linking to internal review page (no affiliate, no company website).
Build to verify.

### Step 2.5: Create `src/lib/specs.ts` and `src/lib/products.ts`

**`src/lib/specs.ts`:**
- `SPEC_UNITS` flat map (field key -> unit string)
- `formatSpecValue(value: unknown, unit?: string): string | null` — boolean to Yes/No, number with unit, string passthrough, defensive `Number.isFinite()` guard
- `getSpecEntries(specs: ProductSpecs | null, category: InventoryCategory): { label: string; value: string }[]`

**`src/lib/products.ts`:**
- `getRelatedProducts(current: Product, allProducts: Product[], limit?: number): Product[]`
- Simplified algorithm: same category, ±30% price if price > 0, take first 4, backfill if < 3

### Step 3: Create product page (`[category]/[slug].astro`)

This is the core of the issue. Create `src/pages/reviews/[category]/[slug].astro` with:
- `getStaticPaths()` generating paths for all products; use `category_slug ?? 'other'` as category param
- Build guard: `throw` if products array is empty (FLOW-001)
- Breadcrumb nav (FLOW-002)
- Full product template: hero, conditional disclosure, verdict, specs, pros/cons, video, related, reviewed
- JSON-LD Product schema injected via head slot
- All null/empty field handling per the spec
- `displayPrice` guard for `retail_price <= 0` (FLOW-007)
- Rating with `aria-label` (FLOW-004)
- Pros/cons filtered with `.filter(Boolean)` (FLOW-013)
- Product image alt: `"Photo of {product_name}"` (FLOW-014)
- Title: `"{product_name} Review"`, description: `short_verdict || "Read our review of {product_name}."` (FLOW-010)

### Step 4: Create category pages (`[category]/index.astro`)

Create `src/pages/reviews/[category]/index.astro` with:
- `getStaticPaths()` for the 4 category slugs (mice, keyboards, mousepads, iems — NOT "other")
- Build guard: `throw` if products array is empty (FLOW-001)
- Breadcrumb nav: `Reviews > {Category Name}` (FLOW-002)
- Grid of product cards (reuse PickCard)
- Sort by rating (descending) or date_acquired (descending)
- Empty state: "No {category} reviews yet" + "Browse all reviews" CTA linking to `/reviews` (FLOW-006)
- Category name in heading (from CATEGORY_LABELS)
- Title: `"{Category} Reviews — Dazz Trazak"` (FLOW-010)

### Step 5: Rewrite master index (`reviews/index.astro`)

Rewrite `src/pages/reviews/index.astro` with:
- All products rendered as cards with `data-*` filter attributes
- Filter controls in `<fieldset>` with `<legend>` (FLOW-009)
- Filter state persisted to URL query params (FLOW-011)
- `aria-live="polite"` region for product count / "No results" (FLOW-009)
- Product count display
- Category quick links
- Empty state when filters match nothing
- "Other" category products included (linking to `/reviews/other/{slug}`)

### Step 6: Verify build

- `npx astro build` — all pages generate (8 existing + category pages + product pages)
- Verify category pages link correctly to product pages
- Verify master index shows all products
- Verify "other" category products have working detail pages
- Verify breadcrumbs render correctly on product and category pages

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/youtube.ts` | Extracted YouTube ID parser + iframe constants (from index.astro) |
| `src/lib/specs.ts` | Spec label auto-generation, unit map, `getSpecEntries()` (ARCH-001 + SIMP-002) |
| `src/lib/products.ts` | `getRelatedProducts()` algorithm (ARCH-002 + SIMP-001) |
| `src/pages/reviews/[category]/index.astro` | Category listing page |
| `src/pages/reviews/[category]/[slug].astro` | Individual product page |

## Files to Modify

| File | Change |
|------|--------|
| `src/layouts/BaseLayout.astro` | Add `<slot name="head" />`, optional `ogType` prop, wire `og:type` meta |
| `src/components/PickCard.astro` | Fix fallback link to use `category_slug ?? 'other'`, "Read Review" text |
| `src/pages/index.astro` | Import YouTube parser from `src/lib/youtube.ts` |
| `src/pages/reviews/index.astro` | Full rewrite: filterable product catalog |

## No New Components

All product page sections are inline in `[slug].astro` — they are single-use, page-specific markup. Extracting components for sections used only on one page would add indirection without reuse benefit. If a section is later needed elsewhere, extract at that point (YAGNI).

The category pages and master index reuse `PickCard` for product cards.

## Edge Cases

- No products from API: build fails with explicit error (FLOW-001)
- Product with `category_slug === null`: assigned "other", gets page at `/reviews/other/[slug]` (FLOW-003)
- Product with no `image_url`: generic inline SVG placeholder (SIMP-005)
- Product with no `retail_price` or `retail_price <= 0`: omit price display, related products uses category-only matching (FLOW-007)
- Product with no `affiliate_link` and no `company_website`: omit buy button, hide affiliate disclosure (FLOW-015)
- Product with no `video_url`: hide video section
- Product with no `specs`: hide specs section
- Product with no `short_verdict`: hide verdict section
- Product with no `pros` and no `cons`: hide pros/cons section (filter empty strings with `.filter(Boolean)`) (FLOW-013)
- Product with no `rating`: hide rating, don't include in JSON-LD review
- Product with no `date_acquired`: hide "Reviewed" timestamp
- Related products: < 3 price matches -> fill with same-category; 0 same-category -> hide section
- Duplicate slugs: handled by CRM (unique constraint), `getStaticPaths()` uses props not `getProductBySlug()`
- Invalid slug in `getStaticPaths()`: only generates paths from actual API data
- Affiliate link URL fails validation: fall back to company website or omit
- Spec values: null -> skip row, boolean -> "Yes"/"No", number with `Number.isFinite()` guard + units (FLOW-005)
- Category page with 0 products: "No {category} reviews yet" + "Browse all reviews" CTA (FLOW-006)
- Filter state: persisted to URL params, restored on back-button (FLOW-011)

## Learnings Applied

- YouTube embed: reuse `extractYouTubeId()` with 11-char regex, `youtube-nocookie.com`, iframe `sandbox`
- Specs table: `<dt>` before `<dd>`, use `flex-col-reverse` if needed for visual order
- Tailwind dynamic classes: use explicit maps for rating colors, not template interpolation
- API data: validate URLs with HTTPS check before `href`, `Number.isFinite()` for numeric specs
- Multi-instance: use `data-*` attributes + `querySelectorAll` for filter JS, not `getElementById`
- Env vars: keep `API_BASE_URL` and `API_KEY` without `PUBLIC_` prefix
- `Record<string, unknown>` rendering: guard NaN/Infinity, filter negatives, brand-name overrides
- `mailto:` injection: validate with regex rejecting `?`, `&`, whitespace
- `<dl>` semantic ordering: `<dt>` before `<dd>` in DOM, CSS for visual reorder

## Review Findings Applied

- FLOW-001: Build guard for 0 products (throw instead of silent empty deploy)
- FLOW-002: Breadcrumbs on product and category pages
- FLOW-003: "Other" category products get `/reviews/other/[slug]` routes
- FLOW-004: Rating `aria-label="Rating: X out of 10"`
- FLOW-005: Defensive spec formatting with `Number.isFinite()` guard
- FLOW-006: Category empty state with "Browse all reviews" CTA
- FLOW-007: `retail_price <= 0` treated as null
- FLOW-009: Filter fieldset/legend + aria-live region
- FLOW-010: Title/description patterns for all page types
- FLOW-011: URL query param persistence for filter state
- FLOW-012: "Last Updated" renamed to "Reviewed"
- FLOW-013: Pros/cons `.filter(Boolean)` for empty strings
- FLOW-014: Product image alt "Photo of {name}"
- FLOW-015: Conditional affiliate disclosure (only with affiliate link)
- ARCH-001 + SIMP-002: Specs extracted to `src/lib/specs.ts` with auto-labels + flat SPEC_UNITS
- ARCH-002 + SIMP-001: Related products extracted to `src/lib/products.ts`, no price-distance sort
- ARCH-005: PickCard "Read Review" text for internal links
- ARCH-007: YouTube iframe constants exported from `src/lib/youtube.ts`
- SIMP-005: Generic placeholder (not category-specific SVGs)

## Progress Log

- 2026-02-09: Plan created from codebase + learnings research
- 2026-02-09: Plan reviewed (spec-flow, architecture, simplicity). Applied 19 findings.
- 2026-02-09: Implementation complete. Steps 0-6 done, build passes (8 pages + dynamic routes).
