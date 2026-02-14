---
title: "Deal Card Misleading Pricing When Sale >= Normal Price"
category: "edge-case"
tags: ["pricing", "ui", "deals", "validation", "e-commerce"]
severity: "high"
date: "2026-02-09"
---

# Deal Card Misleading Pricing When Sale >= Normal Price

## Problem

A `DealCard` component displayed sale pricing with green text and a crossed-out normal price, implying a discount. But when the API returned `sale_price >= normal_price` (a price increase or equal pricing), the UI still showed the "sale" price in green with the normal price struck through — misleading users into thinking they were getting a deal.

## Root Cause

The savings calculation correctly clamped negative savings to 0 (no badge shown), but the pricing display unconditionally used discount styling regardless of the relationship between the two prices.

```typescript
// Savings badge correctly hidden (clampedSavings = 0)
const savings = normalPrice > 0
  ? Math.round(((normalPrice - salePrice) / normalPrice) * 100)
  : 0;

// BUT pricing display always used discount styling:
<span class="text-green-400">${salePrice}</span>
<span class="line-through">${normalPrice}</span>
```

## Fix

Introduce a `hasSavings` flag and conditionally render pricing styles:

```typescript
const hasSavings = normalPrice > 0 && salePrice < normalPrice;

// In template:
{hasSavings ? (
  <>
    <span class="text-green-400">${salePrice}</span>
    <span class="line-through">${normalPrice}</span>
  </>
) : (
  <span class="text-white">${salePrice}</span>
)}
```

## Key Insight

Price comparison UIs need three states, not two: discount (sale < normal), no discount (sale >= normal), and expired. The "no discount" state is easily missed because developers assume deals always have lower sale prices — but API data can contain price increases, equal pricing, or stale data.

## Gotchas

- `Math.max(0, ...)` on the savings percentage hides negative savings in the badge but doesn't fix the pricing display — both must be guarded.
- The expired state also needs the `hasSavings` guard — don't show a struck-through normal price for expired deals that were never actually discounted.
- This pattern applies to any e-commerce UI: never assume `sale_price < normal_price` — always validate the relationship explicitly.
