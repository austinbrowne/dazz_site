---
title: "parseFloat NaN Breaks JavaScript Array Sort"
category: "edge-case"
tags: ["javascript", "sort", "nan", "client-side", "table"]
severity: "high"
date: "2026-02-09"
---

# parseFloat NaN Breaks JavaScript Array Sort

## Problem

Client-side sortable tables used `parseFloat(valA) - parseFloat(valB)` in their sort comparator for numeric columns. When a `data-sort-value` attribute contained a non-numeric or empty string, `parseFloat` returned `NaN`, and `NaN - number = NaN`. The `Array.sort` specification says comparators returning `NaN` produce implementation-defined ordering — rows jump unpredictably on repeated clicks.

## Root Cause

The sort comparator handled empty strings (sorted to bottom) but not the case where a non-empty value fails to parse as a number.

```typescript
// BEFORE: NaN from parseFloat breaks sort stability
if (type === 'number') {
  cmp = parseFloat(valA) - parseFloat(valB);
}
```

## Fix

Guard `parseFloat` results with `isNaN()` checks, treating unparseable values like empty values (sort to bottom):

```typescript
// AFTER: NaN values sort to bottom
if (type === 'number') {
  const numA = parseFloat(valA);
  const numB = parseFloat(valB);
  if (isNaN(numA) && isNaN(numB)) return 0;
  if (isNaN(numA)) return 1;
  if (isNaN(numB)) return -1;
  cmp = numA - numB;
}
```

## Key Insight

`NaN` is the silent killer in JavaScript sort comparators. Unlike `null` or `undefined`, `NaN` passes truthiness checks (`NaN !== ''`), doesn't throw errors, and produces subtly broken behavior rather than a visible crash. Always guard `parseFloat`/`Number()` results in comparators.

## Gotchas

- `NaN > 0` is `false`, `NaN < 0` is `false`, `NaN === NaN` is `false` — NaN poisons all comparisons.
- The empty-string check (`valA === ''`) doesn't catch this — a value like `"N/A"` or `"--"` passes the empty check but still produces NaN from `parseFloat`.
- This pattern was duplicated across two pages (compare table + mousepad table). Extract sort logic to a shared utility to avoid fixing in N places.
