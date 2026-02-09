---
title: "Astro Multi-Instance Components — Data Attributes Over IDs"
category: "frontend"
tags: ["astro", "components", "javascript", "accessibility", "dom"]
severity: "high"
date: "2026-02-09"
---

# Astro Multi-Instance Components — Data Attributes Over IDs

## Problem

An Astro component using `getElementById` with hardcoded IDs breaks when multiple instances appear on the same page (e.g., a newsletter form in both the page body and footer). Only the first instance works; subsequent instances are silently ignored.

## Root Cause

Astro deduplicates `<script>` tags — the script runs once regardless of how many times the component is rendered. With `getElementById`, only the first DOM element with that ID is found. HTML spec requires IDs to be unique per page.

## Solution

1. Replace `id` attributes with `data-*` attributes (e.g., `data-newsletter-form`)
2. Use `document.querySelectorAll('[data-newsletter-form]')` with `.forEach()` to attach independent handlers
3. Scope child element queries to each instance using `form.parentElement?.querySelector()` or `form.querySelector()`
4. Nest `<input>` inside `<label>` to avoid `for`/`id` association (or generate unique IDs)

```typescript
// BAD: Only works for first instance
const form = document.getElementById('newsletter-form');
form?.addEventListener('submit', handler);

// GOOD: Works for all instances
document.querySelectorAll<HTMLFormElement>('[data-newsletter-form]').forEach((form) => {
  const status = form.parentElement?.querySelector('[data-newsletter-status]');
  // Each closure has its own scoped references
  form.addEventListener('submit', async (e) => { /* ... */ });
});
```

## Key Insight

Each `.forEach()` callback creates a closure with its own `form`, `status`, `button`, and `emailInput` references. The handlers are completely independent — one form submitting doesn't affect another. This pattern scales to any number of instances.

## Prevention

- Never use `getElementById` in Astro component `<script>` blocks
- Always use `data-*` attributes + `querySelectorAll` for components that might appear multiple times
- Scope child queries relative to the component root, not the document
