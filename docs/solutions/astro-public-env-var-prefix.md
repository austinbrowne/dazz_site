---
title: "Astro PUBLIC_ Env Var Prefix Exposes Values to Client"
category: "security"
tags: ["astro", "environment-variables", "security", "build-time"]
severity: "high"
date: "2026-02-08"
---

# Astro PUBLIC_ Env Var Prefix Exposes Values to Client

## Problem

Environment variable named `PUBLIC_API_URL` containing an internal Docker hostname (`http://mouse-domination:5000/api/v1/public`) would be exposed in client-side JavaScript bundles.

## Root Cause

In Astro 5, any environment variable prefixed with `PUBLIC_` is included in client-side bundles (similar to `NEXT_PUBLIC_` in Next.js or `VITE_` in Vite). This is by design for values that need to be available in `<script>` tags and client-side islands.

For build-time-only values (like API URLs used in `.astro` frontmatter for SSG data fetching), the `PUBLIC_` prefix is unnecessary and dangerous -- it leaks internal infrastructure details.

## Fix

Rename the variable to remove the `PUBLIC_` prefix:

```typescript
// Before (WRONG -- exposes to client)
const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://...';

// After (CORRECT -- server/build-time only)
const API_BASE = import.meta.env.API_BASE_URL || 'http://...';
```

## Gotchas

- Astro frontmatter (the `---` block in `.astro` files) runs server-side/build-time only, so non-`PUBLIC_` env vars are accessible there
- `PUBLIC_` is only needed for code inside `<script>` tags or client-side framework components
- The hardcoded fallback URL in source code also leaks infrastructure topology -- consider failing fast instead of providing a default
- `API_KEY` was correctly NOT prefixed with `PUBLIC_` in this codebase
