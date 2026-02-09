---
title: "Tailwind Dynamic Classes Are Fragile — Use Explicit Maps"
category: "frontend"
tags: ["tailwind", "css", "tailwind-v4", "jit", "dynamic-classes"]
severity: "medium"
date: "2026-02-09"
---

# Tailwind Dynamic Classes Are Fragile — Use Explicit Maps

## Problem

Template literals like `` `text-${color}-400` `` in JavaScript produce dynamic class names that Tailwind's build-time scanner cannot detect. The classes are silently excluded from the generated CSS, causing invisible styling failures.

## Root Cause

Tailwind (v3 JIT and v4) scans source files for complete class name strings at build time. It does **not** execute JavaScript. A template literal like `` `text-${color}-400` `` never appears as a literal string, so classes like `text-green-400`, `text-red-400`, `text-yellow-400` are not included in the CSS output.

If these class names happen to appear elsewhere in the file (e.g., in a `classList.remove()` call), they'll be detected — but this is fragile and breaks when the code is refactored.

## Solution

Use an explicit object map instead of string interpolation:

```typescript
// BAD: Tailwind can't detect these
status.classList.add(`text-${color}-400`);

// GOOD: All class names are literal strings in the source
const STATUS_COLORS = {
  green: 'text-green-400',
  red: 'text-red-400',
  yellow: 'text-yellow-400',
} as const;

status.classList.add(STATUS_COLORS[color]);
```

## Key Insight

Tailwind's scanner is a regex-based static analysis tool, not a JavaScript interpreter. Any class name that only exists as the result of string concatenation or template interpolation is invisible to it. The explicit map pattern guarantees every class name appears as a complete literal string in the source code.

## Prevention

- Never use template literals for Tailwind class names
- Use object maps that contain full class name strings
- This applies to all dynamic Tailwind patterns: `bg-${x}`, `text-${x}`, `border-${x}`, etc.
- Same issue exists in React/JSX: `className={`bg-${status}-500`}` will fail
