---
title: "Rendering Record<string, unknown> API Data Safely"
category: "frontend"
tags: ["typescript", "api-data", "validation", "record", "unknown-types"]
severity: "medium"
date: "2026-02-09"
---

# Rendering Record<string, unknown> API Data Safely

## Problem

An API returns loosely-typed data as `Record<string, unknown>` (e.g., platform stats, audience demographics). Rendering these key-value pairs requires handling: non-primitive values (objects, arrays, booleans), NaN/Infinity, negative numbers, empty keys, and formatting numbers for display. Without guards, the page can display "[object Object]", "NaN", negative counts, or empty labels.

## Root Cause

TypeScript's `as T` cast in API fetch functions provides no runtime validation. `Record<string, unknown>` can contain any value type. Number edge cases (`NaN`, `Infinity`, negative) pass `typeof value === 'number'` checks. Empty or malformed keys produce broken labels after string transformation.

## Solution

A three-function pipeline that filters, transforms, and validates:

```typescript
const BRAND_NAMES: Record<string, string> = {
  youtube: 'YouTube', twitter: 'Twitter', tiktok: 'TikTok',
};

function formatStatKey(key: string): string {
  return key
    .split('_')
    .filter(Boolean)                    // Remove empty segments from leading/trailing/double underscores
    .map((word) => BRAND_NAMES[word.toLowerCase()] ?? (word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function formatStatValue(value: unknown): string | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;  // Reject NaN, Infinity, negative
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) {
      const k = (value / 1_000).toFixed(1);
      if (parseFloat(k) >= 1000) return '1M';               // Handle rounding boundary
      return `${k.replace(/\.0$/, '')}K`;
    }
    return value.toLocaleString();
  }
  if (typeof value === 'string') return value;
  return null;  // Reject objects, arrays, booleans, null, undefined
}

function getRenderableEntries(record: Record<string, unknown> | null): [string, string][] {
  if (!record) return [];
  return Object.entries(record)
    .filter(([key]) => key.trim() !== '')      // Skip empty keys
    .map(([key, value]) => [key, formatStatValue(value)] as [string, string | null])
    .filter((entry): entry is [string, string] => entry[1] !== null);
}
```

Then check `entries.length > 0` before rendering the section heading to avoid empty grids.

## Key Insight

The rounding boundary at 999,950 is subtle: `(999950 / 1000).toFixed(1)` = `"1000.0"`, producing "1000K" instead of "1M". Always check if the formatted result rounds up to the next tier. The `BRAND_NAMES` override map is essential because naive title-casing produces "Youtube" not "YouTube".

## Prevention

- Always use `Number.isFinite()` before formatting numbers from unknown sources
- Filter negative values for display contexts where they are nonsensical
- Use `.filter(Boolean)` after `.split()` to handle malformed delimiter patterns
- Check rendered entry count after filtering, not just the source record existence
- Add brand-name overrides for any proper nouns that appear as dictionary keys
