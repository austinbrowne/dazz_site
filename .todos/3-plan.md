# Issue #3: Data Backfill — Content Migration

**Branch:** `issue-3-data-backfill`
**Repo:** mouse_domination
**Status:** IN PROGRESS
**Dependencies:** #2 (complete, merged, migration applied to prod)

## Acceptance Criteria

- [x] Slugs auto-generated for all existing products (176 generated in prod)
- [x] Publish validation enforced (must have short_verdict, rating 1-10, slug, category != "other")
- [ ] ~33 "other" items re-categorized (manual, via CRM UI)
- [ ] Top 10-15 picks backfilled with review data and published (manual)
- [x] Tests for slug generation and publish validation (30 tests)

## Implementation Steps

### Automatable (code)

1. **Slug generation script** — `scripts/generate_slugs.py`
   - Generate slugs from product_name for all Inventory items missing slugs
   - Handle duplicates (append -2, -3, etc.)
   - Idempotent (skip items that already have slugs)
   - [x] Migration already applied in prod

2. **Publish validation** — Add validation to `Inventory.publish()` or a helper
   - Must have: short_verdict, rating, slug, category != "other"
   - Prevent setting is_published=True without minimum fields

3. **Tests** for both slug generation and publish validation

### Manual (via CRM UI — user responsibility)

4. Re-categorize ~33 "other" items to correct categories
5. Prioritized backfill: top 10-15 picks (short_verdict, pros, cons, rating, image_url, retail_price, pick_category)
6. Set is_published=True for completed products
7. Secondary backfill: remaining reviewed products (ongoing)

## Progress Log

- 2026-02-08: Branch created, plan written
- 2026-02-08: Slug generation script created, 18 tests pass
- 2026-02-08: validate_publishable() added to Inventory model
- 2026-02-08: 176 slugs generated in production
- 2026-02-08: Fresh Eyes Review (4 specialists), 10 findings fixed, 30 tests pass
- 2026-02-08: Committed on issue-3-data-backfill (8987c91)
