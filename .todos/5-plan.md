# Issue #5: Email Newsletter Signup

**Branch:** `issue-5-newsletter-signup`
**Repo:** dazz_site
**Status:** COMPLETE
**Dependencies:** #1 (complete)

## Acceptance Criteria

- [ ] Buttondown integration wired into existing `NewsletterSignup.astro` component
- [ ] Signup CTA on: homepage (already present), picks page, footer (persistent)
- [ ] Value prop: "Get weekly deals, new reviews, and hidden gem picks" (already in component)
- [ ] Double opt-in confirmation (Buttondown default behavior)
- [ ] Error handling states with proper UX feedback
- [ ] No API keys exposed in client-side bundle

## Key Decisions

### Buttondown Integration Approach

Two viable approaches exist. **Choose during implementation** once Buttondown account is set up:

**Option A: Embed form POST (recommended for SSG)**
- Form `action` set to Buttondown's embed subscribe URL
- JS intercepts with `fetch()` for AJAX experience, falls back to native form POST if JS fails
- No API key needed — the embed endpoint is public and identified by username
- Buttondown's embed endpoint likely supports CORS (designed for third-party sites)
- If CORS fails, fall back to native form POST (progressive enhancement)

**Option B: Authenticated API**
- `POST https://api.buttondown.email/v1/subscribers` with `Authorization: Token <key>`
- Returns proper JSON with status codes (201, 409, 400)
- API key MUST NOT be in client-side code — would require a server-side proxy (Astro SSR endpoint or serverless function)
- **Reject this approach** — too complex for SSG, contradicts the no-server-proxy decision

**Decision: Option A.** Verify the exact embed endpoint URL and CORS support when setting up the Buttondown account. The implementation should use progressive enhancement: set a real `action` on the form so native POST works without JS, then enhance with `fetch()` for inline feedback.

### Environment Variable

- `BUTTONDOWN_USERNAME` — the Buttondown account username (no `PUBLIC_` prefix, consistent with `API_BASE_URL` / `API_KEY` pattern)
- Read in Astro frontmatter at build time, passed to template via `data-` attribute
- Set in `.env` for local dev, passed via environment at Docker build time (same as existing env vars)

## Current State (What Exists)

The `NewsletterSignup.astro` component is **already scaffolded** from Issue #1:
- Two variants: `'card'` (styled box) and `'inline'` (no wrapper)
- Email input with `required` + `type="email"` validation
- Honeypot field for bot protection
- Accessibility: `aria-label`, `sr-only` label, `role="status"`, `aria-live="polite"`
- Status div for success/error messages
- Client-side JS form handler (currently a TODO placeholder)
- Only placed on homepage (`src/pages/index.astro:68`)

## Implementation Steps

### 1. Refactor NewsletterSignup.astro for multiple instances

**This must happen first** — the current component uses `getElementById` with hardcoded IDs, which breaks when multiple instances exist on the same page.

Changes:
- Remove all `id` attributes (`newsletter-form`, `newsletter-email`, `newsletter-status`)
- Add `data-newsletter-form` attribute to the form element
- Add `data-newsletter-status` attribute to the status div
- Nest `<input>` inside `<label>` to avoid `for`/`id` association (or generate unique IDs)
- In the `<script>` block: use `document.querySelectorAll('[data-newsletter-form]')` and `.forEach()` to attach independent handlers to all form instances
- Each handler scopes its status element via `form.closest('[data-newsletter-form]')` or `form.parentElement.querySelector('[data-newsletter-status]')`

### 2. Wire Buttondown API into the component

Replace the TODO placeholder in the `<script>` block:

**Frontmatter:**
- Read `BUTTONDOWN_USERNAME` from `import.meta.env`
- Pass to component template via `data-buttondown-username` attribute
- If not set: `console.warn` at build time, component still renders (generic error covers this at runtime)

**Form element:**
- Set `action` attribute to Buttondown embed URL (progressive enhancement fallback)
- Set `method="POST"`

**JS form handler — state machine:**
- **Idle**: Button says "Subscribe", input enabled, status hidden
- **Submitting**: Button text changes to "Subscribing...", button AND input disabled
- **Success**: Button stays disabled, input cleared and disabled, green message: "Check your inbox to confirm!"
- **Error (retryable)**: Button re-enabled with original text, input re-enabled with value preserved, red message: "Something went wrong. Try again?"
- **Error (already subscribed)**: Button disabled, input disabled, yellow message: "You're already on the list!"

**Fetch call:**
- Use `fetch()` with `AbortSignal.timeout(10_000)` (matches existing `api.ts` pattern)
- On timeout: treat as retryable error
- On CORS failure: treat as retryable error (native form fallback will work on retry if JS is completely broken)

### 3. Add `BUTTONDOWN_USERNAME` env var

- Add to `.env.example` with placeholder value
- Skip Dockerfile changes (existing `API_BASE_URL` and `API_KEY` don't use ARG/ENV either — fix all together later)

### 4. Place signup CTA on picks page

- Add `NewsletterSignup` (card variant) after the picks sections inside the `hasPicks` branch
- Also add to the empty state section (the current empty state says "Subscribe to get notified" but has no form — fix the broken promise)

### 5. Add newsletter signup to footer (persistent)

- Add inline variant to BaseLayout.astro footer
- New row above the copyright/legal footer
- Use `variant="inline"` for compact footer placement

### 6. Handle homepage duplicate forms

The homepage currently has a newsletter section (`index.astro:67-69`). With the footer newsletter added, the homepage will show TWO identical forms.

**Fix:** Remove the dedicated newsletter section from `index.astro`. The persistent footer handles it on every page. This keeps the homepage cleaner and avoids duplication.

### 7. Verify build passes

- `npx astro build` — all pages render
- Test with and without `BUTTONDOWN_USERNAME` set

## Files to Modify

| File | Change |
|------|--------|
| `src/components/NewsletterSignup.astro` | Multi-instance refactor, wire Buttondown API, state machine |
| `src/pages/picks.astro` | Add NewsletterSignup after picks sections + in empty state |
| `src/pages/index.astro` | Remove dedicated newsletter section (footer handles it) |
| `src/layouts/BaseLayout.astro` | Add inline NewsletterSignup to footer |
| `.env.example` | Add BUTTONDOWN_USERNAME |

## Form State Machine

```
[Idle] --submit--> [Submitting] --201--> [Success]
                                --409--> [Already Subscribed]
                                --4xx--> [Error: retryable]
                                --network/timeout--> [Error: retryable]

[Error: retryable] --submit--> [Submitting]
[Success] -- (terminal, form disabled)
[Already Subscribed] -- (terminal, form disabled)
```

## Edge Cases

- No Buttondown username configured: `console.warn` at build time, generic error at runtime (no special-case code — YAGNI)
- User submits empty form: prevented by HTML `required` attribute
- User submits invalid email: prevented by HTML `type="email"` validation
- Double-click submit: button disabled during request prevents this
- Bot submission: honeypot field catches automated fills
- Buttondown API down / timeout: retryable error with 10s `AbortSignal.timeout`
- JS disabled: native form POST to Buttondown embed URL (progressive enhancement)
- Multiple forms on page: `querySelectorAll` with `data-` attributes, independent handlers

## Review Findings Applied

| Finding | Resolution |
|---------|------------|
| ARCH-002/FLOW-001: API contract ambiguous | Clarified two options, chose embed form with progressive enhancement |
| ARCH-001/FLOW-002: Duplicate IDs | Added explicit Step 1 with data-attribute strategy |
| FLOW-005: State machine unspecified | Added full state machine diagram |
| FLOW-008: Homepage duplicate forms | Added Step 6: remove homepage section, rely on footer |
| FLOW-012: Picks empty state broken promise | Step 4 now adds newsletter to empty state too |
| SIMP-001/ARCH-003: Dockerfile change | Dropped — fix all env vars together later |
| FLOW-015: Fetch timeout | Added AbortSignal.timeout(10_000) |
| ARCH-004: ENV naming | Changed to `BUTTONDOWN_USERNAME` (no PUBLIC_ prefix) |
| FLOW-004: No-JS fallback | Progressive enhancement via form action attribute |
| SIMP-002/ARCH-006: Missing config fallback | console.warn only, no special-case runtime code |

## Progress Log

- 2026-02-08: Plan created from codebase exploration + learnings research
- 2026-02-08: Plan reviewed by 3 agents (Architecture, Spec Flow, Simplicity)
- 2026-02-08: Plan revised — addressed 10 review findings
- 2026-02-08: Branch created, implementation complete, build passes (8 pages)
- 2026-02-09: Code review (Security + Edge Case), applied 2 fixes (maxlength, cooldown)
- 2026-02-09: Committed, merged to main at 1162e4b, issue #5 closed
