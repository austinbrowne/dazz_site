# Dazz Site — Phased Implementation Plan (v2)

*Updated 2026-02-07 after 5-agent review. All Mouse Domination changes are additive (new nullable columns, new methods, new routes). Zero breaking changes to existing CRM.*

## Architecture Overview

**Stack:** Astro 5 + TailwindCSS 4 + TypeScript
**Deployment:** Docker container in existing dazz-infra setup, behind Nginx reverse proxy
**Domain:** dazztrazak.com (or subdomain TBD)
**Data Source:** Mouse Domination CRM via internal REST API (new endpoints)
**Content:** MDX for static content, JSON/API for dynamic product data

### Key Architecture Decisions

1. **Astro SSG with API data fetching at build time** — Products, reviews, affiliate links pulled from Mouse Domination during `astro build`. Site rebuilds on code push and daily scheduled rebuild.
2. **Islands of interactivity (Phase 3)** — Comparison tool and search use Astro islands (Preact components via TSX). No islands needed in Phases 1-2.
3. **Mouse Domination gets a public read-only API** — New Flask blueprint (`routes/public_api.py`) with versioned endpoints (`/api/v1/public/...`). Internal Docker network only. Uses explicit `to_public_dict()` serializers — never the existing `to_dict()` methods.
4. **Content lives in two places** — Structured product data in Mouse Domination DB (single source of truth). Editorial content (guides, explainers) as MDX files in the Astro repo.
5. **All CRM changes are additive** — New nullable columns, new methods, new blueprint. Existing Mouse Domination functionality is untouched.

### Data Flow

```
Mouse Domination DB
        │
        ▼
Public API Blueprint (Flask, /api/v1/public/*, internal network only)
  └── Uses to_public_dict() — explicit field allowlists, never to_dict()
        │
        ▼
Astro Build Process (fetches at build time)
  └── If API unavailable, build fails → previous static deploy stays live
        │
        ▼
Static HTML/CSS/JS → Nginx → Users
```

### Build & Deploy Pipeline

```
Push to main (dazz_site repo) ──or── Daily scheduled rebuild (GitHub Actions cron)
        │
        ▼
GitHub Actions: Install deps → Build Astro (fetches from CRM API) → Docker build → Deploy
        │
        ▼
dazz-infra: docker compose pull dazz-site && docker compose up -d dazz-site
```

**Rebuild triggers (2 only):**
1. Code changes pushed to main (normal CI/CD)
2. Scheduled daily rebuild via GitHub Actions cron (catches new CRM data)

No webhook automation needed — a daily rebuild is fast enough for a solo creator publishing 1-3 reviews per week. If the API is down during build, the build fails and the previous static deploy continues serving.

---

## Phase 1: Foundation & Quick Wins (Week 1-3)

**Goal:** Get the site live with the highest-value, lowest-effort pages. Start collecting emails and generating affiliate revenue immediately.

### Task 1.1: Project Scaffolding & Infrastructure

**What:** Initialize Astro project, configure Tailwind, set up Docker, integrate with dazz-infra. Establish cross-cutting concerns (SEO, legal pages, analytics, error pages).

**Subtasks:**
- [ ] `npm create astro@latest` with TypeScript, strict mode
- [ ] Install & configure TailwindCSS 4 (Astro integration)
- [ ] Create base layout with header, footer, navigation
- [ ] Set up Docker multi-stage build (node build → nginx/static serve)
- [ ] Add service to `dazz-infra/docker-compose.yml`
- [ ] Create nginx site config in `dazz-infra/nginx/sites/` with:
  - HSTS header with `includeSubDomains`
  - Content-Security-Policy (allowlist YouTube embeds, newsletter provider, analytics)
  - Permissions-Policy: `camera=(), microphone=(), geolocation=()`
- [ ] Obtain SSL certificate via certbot
- [ ] Set up GitHub Actions: build on push to main + daily scheduled cron rebuild
- [ ] Basic SEO: sitemap, robots.txt, OpenGraph meta tags
- [ ] Custom 404 page with site branding, search bar, links to key pages
- [ ] Create `/privacy` page (privacy policy covering analytics, newsletter, third-party embeds)
- [ ] Create `/terms` page (basic terms of service)
- [ ] Create `/disclosure` page (FTC affiliate disclosure — full details)
- [ ] Reusable `AffiliateDisclosure.astro` component — placed ABOVE affiliate links on every page, not buried at bottom (FTC requirement)
- [ ] Add Plausible or Umami analytics (single script tag — needed from day one for SEO measurement)
- [ ] Accessibility baseline: semantic HTML, skip navigation link, color contrast verification, ARIA labels in base layout
- [ ] Set up Astro test infrastructure (Vitest + Astro testing utils)

**Dependencies:** None
**Estimated complexity:** Medium

---

### Task 1.2: Mouse Domination Public API + Model Changes

**What:** Add new nullable columns to the Inventory model, create `to_public_dict()` serializers, and add a versioned read-only API blueprint. ALL changes are additive — nothing breaks existing CRM functionality.

**Mouse Domination model additions (all nullable, non-breaking):**
- `image_url` (text) — product image URL or path
- `retail_price` (decimal) — MSRP/retail price for consumers (NOT the `cost` field, which is what the creator paid)
- `short_verdict` (text) — 2-3 sentence public review summary
- `pros` (JSON array) — list of pros for public display
- `cons` (JSON array) — list of cons for public display
- `rating` (integer) — 1-10 rating scale
- `slug` (text, unique) — URL-safe slug, auto-generated from product name with collision handling
- `is_published` (boolean, default False) — controls public visibility (separate from `status` field which tracks CRM workflow)
- `specs` (JSON) — flexible spec storage (weight, sensor, dimensions, etc.)
- `pick_category` (text, nullable) — if set, appears on picks page (e.g., "best_budget_mouse", "best_he_keyboard")

*Note: `video_url` already exists on the model — confirmed at models/business.py:115*

**New serializers (non-breaking — new methods alongside existing `to_dict()`):**
- `Inventory.to_public_dict()` — allowlist: `product_name`, `category`, `image_url`, `retail_price`, `short_verdict`, `pros`, `cons`, `rating`, `slug`, `is_published`, `specs`, `video_url`, `pick_category`, `date_acquired`, `company_name`, `company_website`, `affiliate_link`, `affiliate_code`
- `Company.to_public_dict()` — allowlist: `name`, `category`, `website`, `affiliate_link`, `affiliate_code`
- `CreatorProfile.to_public_dict()` — allowlist: `display_name`, `tagline`, `bio`, `photo_url`, `location`, `website_url`, `social_links`, `platform_stats`, `audience_demographics`, `content_niches`
- **NEVER expose:** `cost`, `sale_price`, `fees`, `shipping`, `profit_loss`, `buyer`, `sale_notes`, `marketplace`, `notes`, `user_id`, `contact_email`, `public_token`, `priority`, `relationship_status`, `commission_rate`

**New Flask blueprint (`routes/public_api.py`):**
- [ ] `GET /api/v1/public/products` — Returns published products (filter: `is_published=True`). Uses `to_public_dict()`.
- [ ] `GET /api/v1/public/products/<slug>` — Single product by slug
- [ ] `GET /api/v1/public/products?pick_category=*` — Products marked as picks
- [ ] `GET /api/v1/public/companies` — Companies with affiliate info (filter: `affiliate_status='yes'`)
- [ ] `GET /api/v1/public/creator-profile` — Public creator profile data
- [ ] API key auth via `X-API-Key` header, validated with `hmac.compare_digest()` (constant-time comparison)
- [ ] Rate limiting via Flask-Limiter (already in use — 60 req/min is plenty for build-time fetching)
- [ ] Request logging for debugging build failures
- [ ] Custom JSON error handler (no stack traces, no internal details)
- [ ] Add to Mouse Domination test suite: assert `to_public_dict()` never contains forbidden fields

**Category mapping:** Inventory uses singular (`mouse`, `keyboard`), URLs use plural (`mice`, `keyboards`). Define mapping in API response (`category_slug` field) so Astro doesn't need to maintain its own mapping.

**Dependencies:** None (can run parallel with 1.1)
**Estimated complexity:** Medium

---

### Task 1.3: Data Backfill — Content Migration

**What:** Populate the new fields for existing reviewed products so the site has content on launch day. This is the difference between a live site and an empty shell.

**Current state:**
- 71 items with status `reviewed` or `keeping`
- ~33 items miscategorized as "other" that need re-categorizing to mice/keyboards/mousepads/iems
- 0 items have populated review data (fields don't exist yet — added in 1.2)

**Subtasks:**
- [ ] Run database migration to add new columns (from 1.2)
- [ ] Auto-generate slugs for all existing products (migration script)
- [ ] Re-categorize ~33 "other" items to correct categories via CRM UI
- [ ] Prioritized backfill — start with top picks (10-15 products):
  - Fill in `short_verdict`, `pros`, `cons`, `rating` for each
  - Add `image_url` (manufacturer product images or own photos)
  - Add `retail_price`
  - Set `is_published=True`
  - Set `pick_category` for top picks
- [ ] Define minimum data requirements for `is_published=True`: must have `short_verdict`, `rating`, `slug`, and `category` (not "other")
- [ ] Secondary backfill: remaining reviewed products (can continue after launch)

**Estimated effort:** ~15-20 minutes per product for the editorial fields. Top 15 picks = ~5 hours. Full 71 products = ~20 hours over time.

**Dependencies:** 1.2 (model changes must be deployed first)
**Estimated complexity:** Low (tedious but straightforward data entry)

---

### Task 1.4: Affiliate Link Hub / "My Picks" Page

**What:** A curated page with current top recommendations by category. Highest-ROI page on the site.

**Content structure:**
```
/picks
├── Best Budget Mouse
├── Best Mid-Range Mouse
├── Best Premium Mouse
├── Best Wireless Mouse
├── Best HE Keyboard
├── Best Budget Keyboard
├── Best Mousepad (Speed)
├── Best Mousepad (Control)
├── Best Budget IEMs
└── Best Gaming IEMs
```

**Subtasks:**
- [ ] Create `/picks` page layout with category sections
- [ ] Product cards with: image (fallback to category placeholder SVG if missing), name, retail price, one-line verdict, affiliate button
- [ ] Pull picks data from API (`/api/v1/public/products?pick_category=*`) at build time
- [ ] Handle missing data gracefully: no image → placeholder, no price → omit price, no affiliate link → "Check Price" button linking to manufacturer
- [ ] Add "Last updated: [date]" to build trust
- [ ] Responsive grid layout (mobile-first)
- [ ] `AffiliateDisclosure` component above product cards (FTC compliance)

**Dependencies:** 1.1 (site exists), 1.2 (API + model), 1.3 (data backfilled for picks)
**Estimated complexity:** Low

---

### Task 1.5: Email Newsletter Signup

**What:** Email capture integrated into the site. Start building the list from day one.

**Subtasks:**
- [ ] Choose provider: Buttondown (simple, cheap, developer-friendly API)
- [ ] Add signup form component (reusable across pages)
- [ ] Place signup CTA on: homepage hero, picks page, footer (persistent)
- [ ] Value prop: "Get weekly deals, new reviews, and hidden gem picks"
- [ ] Double opt-in confirmation
- [ ] Welcome email with link to picks page
- [ ] Error handling states:
  - Success: "Check your inbox to confirm!"
  - Already subscribed: "You're already on the list!"
  - Invalid email: client-side validation before submit
  - API failure: "Something went wrong. Try again?" with retry
- [ ] Rate limiting: prevent spam submissions (client-side debounce + provider-side)

**Dependencies:** 1.1 (site exists)
**Estimated complexity:** Low

---

### Task 1.6: Homepage

**What:** Landing page that establishes brand, links to key content, and captures emails.

**Sections:**
- Hero: Channel branding, tagline, CTA (subscribe to newsletter or browse picks)
- Featured picks (top 3-4 from picks page — pulled from API)
- Latest YouTube video embed (from API `video_url`)
- Category quick links (Mice, Keyboards, Mousepads, IEMs)
- About section (brief bio, links to YouTube/Twitter/podcast)
- Newsletter signup

**Empty state handling:** If no published products exist yet, show a "Reviews coming soon — subscribe for updates" section with newsletter CTA instead of featured picks.

**Subtasks:**
- [ ] Design and implement homepage layout
- [ ] Featured picks section from API (with empty state fallback)
- [ ] Category navigation cards
- [ ] About/bio section
- [ ] Social media links (YouTube, Twitter, podcast platform links)
- [ ] Newsletter CTA integration (from 1.5)

**Dependencies:** 1.1, 1.2, 1.3 (some backfilled data), 1.5
**Estimated complexity:** Low-Medium

---

### Task 1.7: Brand Partnership / "Work With Me" Page

**What:** Professional page for brand inquiries. Pull creator profile stats from Mouse Domination's existing CreatorProfile model.

**Subtasks:**
- [ ] Create `/work-with-me` page
- [ ] Pull stats from CreatorProfile API endpoint
- [ ] Sections: About, Audience Stats, Platform Reach, Services Offered, Past Partners, Contact
- [ ] Contact: simple email link (`mailto:`) or Formspree form with honeypot field
  - If Formspree: required fields (name, email, company, message), success/error states, rate limiting
- [ ] Professional but authentic tone

**Dependencies:** 1.1, 1.2
**Estimated complexity:** Low

---

## Phase 2: Content Engine (Month 1-2)

**Goal:** Build the review database and "best of" guides that drive long-tail SEO traffic and affiliate conversions.

### Task 2.1: Product Review Database

**What:** Searchable, filterable catalog of every published product. Each product gets its own page with specs, verdict, embedded video, and affiliate links.

**Product page template:**
```
/reviews/[category]/[slug]
├── Product hero (image, name, price, rating, affiliate CTA)
├── Affiliate disclosure (above the fold)
├── Quick verdict (2-3 sentences)
├── Specs table
├── Pros / Cons
├── Embedded YouTube review
├── Related products ("Also consider..." — same category + similar price range)
└── Affiliate link + full disclaimer link
```

**Subtasks:**
- [ ] Create dynamic route: `/reviews/[category]/[slug].astro` (NOT catch-all `[...slug]`)
- [ ] Product page template with all sections above
- [ ] Category index pages: `/reviews/mice`, `/reviews/keyboards`, `/reviews/mousepads`, `/reviews/iems`
- [ ] Handle the category mapping: API returns `category_slug` (plural) for URL generation
- [ ] Master index: `/reviews` with filters (category, price range, rating) — vanilla JS filter for Phase 2, upgrade to Preact island in Phase 3 if needed
- [ ] Pull all published product data from API at build time
- [ ] Empty/missing field handling:
  - No image → category placeholder SVG
  - No price → omit price display
  - No affiliate link → "Check Price" linking to manufacturer site
  - No video → hide embed section
  - Missing specs → show "N/A" or hide row
- [ ] SEO: JSON-LD Product schema on each product page
- [ ] "Last updated" timestamp per product
- [ ] Related products: same category + similar price ± 30%. If < 3 matches, show random from same category. If 0, hide section.
- [ ] Slug collision handling: unique constraint on `slug` column + suffix appending on generation (`pulsar-x2`, `pulsar-x2-2`)
- [ ] Continue backfilling product data beyond initial 15 picks (ongoing)
- [ ] Write tests: page generation, API data fetching, missing data handling

**Define spec schemas per category (documented in `src/lib/types.ts`):**
- Mouse: weight, sensor, dpi, polling_rate, battery_life, connectivity, shape, dimensions (L×W×H), switch_type
- Keyboard: switch_type (HE/TMR/mechanical), layout, connectivity, actuation_point, rapid_trigger, analog_input, keycap_type
- Mousepad: surface_type, speed_rating, control_rating, size, thickness, base_type, humidity_resistance
- IEM: driver_type, impedance, frequency_response, connectivity, microphone

**Dependencies:** Phase 1 complete, ongoing backfill from 1.3
**Estimated complexity:** High (biggest task)

---

### Task 2.2: "Best Of" Guides

**What:** Curated, regularly updated guides targeting high-volume search terms. MDX files with API-pulled product data.

**Initial guides:**
```
/guides/best-gaming-mice-under-50
/guides/best-wireless-gaming-mice
/guides/best-hall-effect-keyboards
/guides/best-budget-mousepads
/guides/best-iems-for-gaming
```

**Subtasks:**
- [ ] Create guide MDX template with: intro, methodology blurb, ranked product cards, FAQ section, affiliate disclosure
- [ ] Product cards within guides reference products by slug — build process resolves to live API data (price, rating, affiliate link)
- [ ] "Last updated: [date]" prominently displayed
- [ ] Table of contents (auto-generated from headings)
- [ ] Write initial 3-5 guides
- [ ] SEO: Target specific long-tail keywords in title, H1, meta description
- [ ] Internal linking: Each product mention links to its review page

**Dependencies:** 2.1 (review database exists to link to)
**Estimated complexity:** Medium (template is reusable; writing the content is the main effort)

---

### Task 2.3: HE/TMR Keyboard Explainer Hub

**What:** Educational content hub for hall effect and TMR keyboard technology. MDX-based static content — no API dependency.

**Pages:**
```
/learn/hall-effect-keyboards
├── /what-is-hall-effect
├── /what-is-tmr
├── /hall-effect-vs-tmr
├── /rapid-trigger-explained
├── /analog-input-explained
├── /he-keyboard-buyers-guide
```

**Subtasks:**
- [ ] Create `/learn` section layout with sidebar navigation
- [ ] Write 4-6 educational articles as MDX
- [ ] Include diagrams/illustrations (simple SVGs or annotated images)
- [ ] Cross-link to keyboard reviews in the review database
- [ ] Buyer's guide links to "Best HE Keyboards" guide (2.2)
- [ ] SEO: Target educational queries ("what is rapid trigger," "hall effect vs mechanical," etc.)

**Dependencies:** 2.1 (for cross-linking to reviews), but content can be written in parallel
**Estimated complexity:** Low-Medium (primarily content writing)

---

## Phase 3: Interactive Tools & Differentiators (Month 2-4)

**Goal:** Build interactive tools that differentiate the site. Start with static versions where appropriate, upgrade to interactive when traffic justifies it.

**Prerequisite gate:** At least 30 published products with specs before starting comparison tool/quiz. Without sufficient data, these tools provide little value.

### Task 3.1: Static Comparison Table → Interactive Comparison Tool

**V1 (Immediate):** A static MDX page with your top 10-15 mice in a comparison table. Sortable by columns (weight, price, rating). No client-side framework needed — vanilla JS or CSS-only.

**V2 (When traffic justifies — upgrade to interactive):**
- Astro island (Preact component via TSX)
- Select any 2-3 reviewed mice for side-by-side comparison
- Highlight differences (better/worse indicators)
- Shareable URL (`/compare?a=pulsar-x2&b=razer-viper-v3`)
- Product data served as a static JSON file (`/api/products.json` generated at build time), NOT inlined in HTML
- Handle missing specs: show "--" for unpopulated fields, hide rows where both products lack the spec
- Affiliate links in comparison view
- SEO: Generate static pages for popular matchups

**Dependencies:** 2.1 (review database with specs), 30+ published products with specs
**Estimated complexity:** V1: Low. V2: High

---

### Task 3.2: Static Buying Guide → Interactive Mouse Quiz

**V1 (Immediate):** A static MDX "Mouse Buying Guide" with a text-based decision flowchart. "If you have small hands and play FPS → consider X, Y, Z." Achieves 80% of the value with 10% of the effort.

**V2 (When traffic justifies):**
- Multi-step quiz (Preact island)
- Questions: hand size, grip style, budget, wired/wireless, weight preference, primary use
- Scoring algorithm matching answers to mouse specs
- Results page: top 3 recommendations with reasoning
- Email capture: "Get your results + deal alerts"
- Shareable results URL
- Zero-results fallback: "No exact matches — here are the closest options" with relaxed criteria

**Dependencies:** 2.1 (review database with specs), 30+ published mice with specs
**Estimated complexity:** V1: Low. V2: High

---

### Task 3.3: Deal Tracker (Manual)

**What:** A "Current Deals" page showing sales on recommended products. Manual updates only — no automation.

**Subtasks:**
- [ ] Create `/deals` page template
- [ ] Deal card component: product image, prices, savings %, affiliate link, expiration date
- [ ] "Expired" state for past deals (strikethrough + hide after 7 days)
- [ ] Empty state: "No active deals right now. Subscribe for deal alerts!" with newsletter CTA
- [ ] CRM integration: Add `Deal` model to Mouse Domination (non-breaking — new model)
  - Fields: `product_id` FK, `normal_price`, `sale_price`, `retailer`, `affiliate_link`, `start_date`, `end_date`, `is_active`
- [ ] Quick-add deal form in CRM UI
- [ ] Add deals to public API: `GET /api/v1/public/deals` (active only)

**Dependencies:** Phase 1 complete
**Estimated complexity:** Low-Medium

---

### Task 3.4: Mousepad-Specific Filtering (Enhancement to 2.1)

**What:** Add mousepad-specific filter UI to the existing `/reviews/mousepads` index page. NOT a separate database — leverages the flexible `specs` JSON field from the review database.

**Subtasks:**
- [ ] Define mousepad spec schema in `specs` JSON: speed_rating, control_rating, surface_type, size, thickness, base_type, humidity_resistance
- [ ] Add filter dropdowns on `/reviews/mousepads` page: filter by speed/control range, surface type, size
- [ ] Sortable table view option (all pads in one table)

**Dependencies:** 2.1 (review database infrastructure)
**Estimated complexity:** Low (enhancement, not new infrastructure)

---

## Future Ideas (Not Planned — Revisit When Traffic Justifies)

*These are product ideas that require fundamentally different architecture (server-side processing, user auth, third-party API integrations). Each should get its own plan when the conditions are met.*

| Idea | Condition to Revisit |
|------|---------------------|
| Podcast Archive + Show Notes | 10+ completed episodes in CRM |
| Podcast Workflow Automation (Whisper/LLM) | Manual podcast process established and painful |
| User-Submitted Mouse Fit Data | 1,000+ monthly visitors, established review database |
| Automated Deal Tracking (Amazon API) | Manual deal tracker proves popular |
| Peripheral Setup Showcase / Gallery | Active community engagement |
| Membership / Premium Tier (Stripe) | Consistent traffic + audience requesting exclusive content |
| Automated Social Cross-Posting | Publish workflow is frequent and manual posting is painful |
| Advanced Analytics Dashboard | Enough traffic to produce meaningful data patterns |

---

## Mouse Domination Changes Summary

**ALL changes are additive. Zero breaking changes to existing CRM.**

### New nullable columns on Inventory model:
| Column | Type | Purpose |
|--------|------|---------|
| `image_url` | text | Product image URL |
| `retail_price` | decimal | Consumer retail price (NOT `cost`) |
| `short_verdict` | text | 2-3 sentence public summary |
| `pros` | JSON | List of pros |
| `cons` | JSON | List of cons |
| `rating` | integer | 1-10 score |
| `slug` | text (unique) | URL-safe slug |
| `is_published` | boolean (default False) | Public visibility toggle |
| `specs` | JSON | Flexible spec storage |
| `pick_category` | text | Picks page placement |

*Note: `video_url` already exists — no change needed.*

### New model (Phase 3):
- `Deal` — price tracking for deals page

### New methods (non-breaking):
- `Inventory.to_public_dict()` — field allowlist for public API
- `Company.to_public_dict()` — field allowlist for public API
- `CreatorProfile.to_public_dict()` — field allowlist for public API

### New blueprint:
- `routes/public_api.py` — Versioned (`/api/v1/public/...`), internal Docker network only, API key auth with `hmac.compare_digest()`

### Data cleanup:
- Re-categorize ~33 "other" items to correct categories (mice, keyboards, etc.) via existing CRM UI

---

## Astro Project Structure

```
dazz_site/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── Dockerfile
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro          # HTML head, nav, footer, skip nav, analytics
│   │   └── ReviewLayout.astro        # Product review page layout
│   ├── pages/
│   │   ├── index.astro               # Homepage
│   │   ├── picks.astro               # Affiliate picks page
│   │   ├── work-with-me.astro        # Brand partnerships
│   │   ├── deals.astro               # Current deals (Phase 3)
│   │   ├── privacy.astro             # Privacy policy
│   │   ├── terms.astro               # Terms of service
│   │   ├── disclosure.astro          # FTC affiliate disclosure
│   │   ├── 404.astro                 # Custom 404 page
│   │   ├── reviews/
│   │   │   ├── index.astro           # All reviews with filters
│   │   │   ├── [category]/
│   │   │   │   ├── index.astro       # Category index
│   │   │   │   └── [slug].astro      # Individual product page
│   │   ├── guides/
│   │   │   └── *.mdx                 # Best-of guides
│   │   ├── learn/
│   │   │   └── *.mdx                 # Educational content (HE/TMR hub)
│   │   └── compare.astro             # Comparison (static table → interactive)
│   ├── components/
│   │   ├── ProductCard.astro
│   │   ├── AffiliateButton.astro     # Conditional: shows "Check Price" if no affiliate link
│   │   ├── AffiliateDisclosure.astro # FTC-compliant, placed above links
│   │   ├── NewsletterSignup.astro    # With error/success states
│   │   ├── EmptyState.astro          # Reusable empty state component
│   │   ├── ComparisonTool.tsx        # Phase 3 Preact island
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts                    # Fetch from Mouse Domination API
│   │   ├── types.ts                  # TypeScript interfaces + spec schemas per category
│   │   ├── categories.ts             # Category slug mapping (singular → plural)
│   │   └── utils.ts
│   ├── content/
│   │   └── guides/                   # MDX content for guides
│   └── styles/
│       └── global.css                # Tailwind imports + custom styles
├── public/
│   ├── images/
│   │   ├── placeholders/             # Category placeholder SVGs for missing product images
│   │   └── favicon.svg
│   └── robots.txt
└── tests/                            # Vitest tests for pages, components, API fetching
```

---

## Review Findings Addressed

| Finding | Resolution |
|---------|-----------|
| No product images | Added `image_url` field + placeholder fallbacks |
| No retail price | Added `retail_price` field (separate from `cost`) |
| No content backfill plan | Added Task 1.3 with prioritized approach |
| Phase 1 depends on Phase 2 data | Moved model changes to Task 1.2, backfill to Task 1.3 |
| 46% products miscategorized as "other" | Added re-categorization to Task 1.3 data cleanup |
| `to_dict()` leaks CRM data | Mandated `to_public_dict()` with explicit allowlists |
| Podcast tasks built on zero data | Deferred to "Future Ideas" gated on 10+ episodes |
| Phase 4 is a different product | Replaced with "Future Ideas" table with conditions |
| Webhook rebuild premature | Removed — using code push + daily cron only |
| No legal/compliance pages | Added privacy, terms, disclosure pages to Task 1.1 |
| `is_published` needed in Phase 1 | Moved to Task 1.2 model changes |
| No testing strategy | Added test infrastructure to 1.1, tests to 2.1 |
| No analytics until Phase 4 | Added Plausible/Umami to Task 1.1 |
| `[...slug]` catch-all routes | Changed to `[category]/[slug].astro` |
| No API versioning | Using `/api/v1/public/` from day one |
| Island framework undecided | Locked to Preact (TSX), deferred to Phase 3 |
| Mousepad DB redundant | Collapsed to enhancement task 3.4 |
| No empty/error states | Added throughout (homepage, picks, reviews, deals, newsletter) |
| FTC disclosure at page bottom | Moved above affiliate links via reusable component |
| No 404 page | Added to Task 1.1 |
| No accessibility requirements | Added baseline to Task 1.1 |
| Category name mismatch | API returns `category_slug` (plural), mapping in `categories.ts` |
| `notes` field exposure risk | Not exposed — using new `short_verdict` field instead |
| API key timing attack | Using `hmac.compare_digest()` for constant-time comparison |
| No picks curation mechanism | Added `pick_category` field to Inventory model |
