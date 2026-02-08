---
title: "Tailwind CSS v4 Typography Plugin Setup"
category: "configuration"
tags: ["tailwindcss", "typography", "astro", "css"]
severity: "medium"
date: "2026-02-08"
---

# Tailwind CSS v4 Typography Plugin Setup

## Problem

Using `prose`, `prose-invert`, and `prose-zinc` classes on pages (e.g., legal pages like privacy policy, terms of service) but text renders unstyled. No build error occurs.

## Root Cause

Tailwind CSS v4 does not include `@tailwindcss/typography` by default. The `prose` classes are no-ops without the plugin installed. The build succeeds silently because Tailwind v4 does not error on unknown utility classes.

## Fix

1. Install the plugin:
```bash
npm install @tailwindcss/typography
```

2. Register it in your CSS file using the v4 `@plugin` directive (NOT the old `tailwind.config.js` approach):
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

## Gotchas

- In Tailwind v4, plugins are registered with `@plugin` in CSS, not in a config file
- The build will NOT fail if the plugin is missing -- pages just render unstyled
- This was missed by all 8 automated review agents during a fresh-eyes review, caught only by the adversarial validator
- Always visually verify legal/content pages after build
