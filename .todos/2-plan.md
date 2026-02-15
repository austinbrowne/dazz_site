# Issue #2: Mouse Domination Public API + Model Changes

**Branch:** `issue-2-public-api` (in mouse_domination repo)
**Started:** 2026-02-08

## Acceptance Criteria
- New nullable columns added to Inventory model (image_url, retail_price, short_verdict, pros, cons, rating, slug, is_published, specs, pick_category)
- `to_public_dict()` serializers on Inventory, Company, CreatorProfile with explicit allowlists
- NEVER expose: cost, sale_price, fees, shipping, profit_loss, buyer, sale_notes, marketplace, notes, user_id, contact_email, public_token, priority, relationship_status, commission_rate
- Public API blueprint at `/api/v1/public/` with 5 endpoints
- API key auth via X-API-Key header with hmac.compare_digest()
- Rate limiting via Flask-Limiter (60 req/min)
- Custom JSON error handler (no stack traces)
- Tests: assert to_public_dict() never contains forbidden fields

## Implementation Steps

1. [x] Add new columns to Inventory model (all nullable, non-breaking)
2. [x] Create Alembic migration (0595a536d00c)
3. [x] Add `to_public_dict()` to Inventory model
4. [x] Add `to_public_dict()` to Company model
5. [x] Add `to_public_dict()` to CreatorProfile model (already existed in models/media_kit.py)
6. [x] Create `routes/public_api.py` blueprint with all 5 endpoints
7. [x] Register blueprint in app.py (exempt from CSRF)
8. [x] Add PUBLIC_API_KEY to config
9. [x] Write tests for to_public_dict() forbidden fields
10. [x] Write tests for API endpoints
11. [x] Verify all tests pass (20/20 new tests pass, 998/1002 overall — 4 pre-existing failures)

## Past Learnings Applied
- Environment variable naming: use non-PUBLIC_ prefixed names for server-side secrets
- Security: explicit allowlist serializers, never expose internal data
- CreatorProfile already existed — checked models/__init__.py before creating

## Deferred Items
- None identified

## Progress Log
- 2026-02-08: Branch created, starting implementation
- 2026-02-08: All implementation complete, 20 tests passing
