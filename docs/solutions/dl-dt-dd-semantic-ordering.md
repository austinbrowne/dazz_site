---
title: "HTML Definition Lists — dt Must Precede dd in DOM Order"
category: "frontend"
tags: ["html", "accessibility", "semantics", "css", "screen-readers"]
severity: "high"
date: "2026-02-09"
---

# HTML Definition Lists — dt Must Precede dd in DOM Order

## Problem

A stats grid using `<dl>` renders `<dd>` (the value) before `<dt>` (the label) to show the number prominently above the label. Screen readers announce elements in DOM order, so users hear "125K" before "YouTube Subscribers" — the value without context.

## Root Cause

The HTML spec requires each `<dt>` (definition term) to precede its `<dd>` (definition description) within a `<dl>`. Placing `<dd>` first produces invalid HTML. Screen readers follow DOM order, not visual order, so the semantic meaning is broken even though sighted users see the correct layout.

## Solution

Keep `<dt>` before `<dd>` in the DOM, then use CSS `flex-direction: column-reverse` on the wrapping element to flip the visual order:

```html
<!-- DOM order: dt first (correct semantics), dd second -->
<div class="flex flex-col-reverse">
  <dt class="text-sm text-zinc-400">YouTube Subscribers</dt>
  <dd class="text-2xl font-bold text-white mb-1">125K</dd>
</div>
```

Screen readers announce: "YouTube Subscribers: 125K" (correct).
Visual display: 125K on top, label below (desired layout).

## Key Insight

CSS visual order (`order`, `flex-direction`, `grid` placement) does NOT affect screen reader announcement order. Screen readers always follow the DOM. When visual and DOM order conflict, always prioritize correct DOM semantics and fix the visual with CSS.

## Prevention

- Always put `<dt>` before `<dd>` in the source
- Use `flex-col-reverse` or CSS `order` when the design calls for value-first visual layout
- Test with a screen reader or use browser dev tools' accessibility inspector
