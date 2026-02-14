---
title: "SSG N+1 API Calls from Cache Bypass"
category: "performance"
tags: ["astro", "ssg", "api", "cache", "n-plus-1"]
severity: "critical"
date: "2026-02-09"
---

# SSG N+1 API Calls from Cache Bypass

## Problem

During SSG build, a component (`ProductCardEmbed`) called `getProductBySlug(slug)` which made an individual HTTP request per invocation. With 45 embed instances across 6 guide MDX files, this produced 45 separate API calls despite a module-level `_productsCache` already being populated by `getProducts()`.

## Root Cause

`getProductBySlug()` was implemented as a direct API call (`apiFetch('/products/${slug}')`) rather than a cache lookup. The function existed alongside `getProducts()` which populated `_productsCache`, but the two were disconnected — `getProductBySlug` never consulted the cache.

```typescript
// BEFORE: bypasses cache, makes individual HTTP request
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
}
```

## Fix

Refactor `getProductBySlug` to use the cached product list via `getProducts()`:

```typescript
// AFTER: uses cache, zero additional HTTP requests
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(`Invalid slug: ${slug}`);
    return null;
  }
  const all = await getProducts();
  return all.find(p => p.slug === slug) ?? null;
}
```

## Key Insight

In SSG builds, module-level caches (`let _cache: T[] | null = null`) deduplicate API calls across pages. But any function that makes its own `apiFetch()` call bypasses this cache entirely. Every API accessor function should go through the cached `getAll()` function, not make individual requests — even if the API supports per-slug endpoints.

## Gotchas

- The N+1 pattern is invisible during development with a fast local API — it only becomes a problem with slow/rate-limited production APIs or large content collections.
- TypeScript types don't help here — both implementations have the same signature and return type. Only reviewing the implementation reveals the bypass.
- This was flagged independently by 3 out of 7 review specialists, making it the highest-signal finding in the review.
