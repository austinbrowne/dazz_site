---
title: "Nginx Cache-Control immutable vs TTL for Static Sites"
category: "performance"
tags: ["nginx", "caching", "astro", "performance"]
severity: "medium"
date: "2026-02-08"
---

# Nginx Cache-Control immutable vs TTL for Static Sites

## Problem

Using `Cache-Control: public, immutable` with `expires 1d` on all static assets is contradictory. `immutable` means "never revalidate", but `expires 1d` means "revalidate after 24 hours".

## Root Cause

Astro generates content-hashed filenames for processed JS/CSS (e.g., `_astro/index.D3k9f2.css`), but assets in `public/` (images, favicons, fonts) are served at their original filenames with no hash. Applying the same cache policy to both types of assets is wrong.

## Fix

Split cache rules by asset type:

```nginx
# Hashed assets (Astro _astro/ directory) -- safe for long-lived immutable
location /_astro/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Non-hashed static assets -- shorter TTL with revalidation
location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 7d;
    add_header Cache-Control "public, must-revalidate";
}
```

## Gotchas

- `immutable` should only be used with content-hashed filenames where the URL changes when the content changes
- Astro's `_astro/` directory always contains hashed filenames -- safe for immutable
- Assets in `public/` keep their original filenames -- stale content risk with immutable
- Also add gzip compression (not enabled by default in `nginx:alpine`):
  ```nginx
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
  gzip_min_length 256;
  gzip_vary on;
  ```
