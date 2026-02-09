---
title: "Mailto Link Injection — Validate API-Sourced Email Before href"
category: "security"
tags: ["mailto", "injection", "email", "validation", "api-data"]
severity: "medium"
date: "2026-02-09"
---

# Mailto Link Injection — Validate API-Sourced Email Before href

## Problem

Building a `mailto:` href from an API-sourced email address can allow injection of mailto parameters (`?cc=`, `?bcc=`, `?subject=`, `?body=`) if the email string contains `?` or `&` characters. A malicious or corrupted API response could pre-populate hidden recipients or body content when a visitor clicks the link.

## Root Cause

The `mailto:` URI scheme supports query parameters: `mailto:user@example.com?cc=attacker@evil.com&subject=Hi`. If the "email" value from an API contains these characters, they are interpreted by mail clients as parameters, not as part of the email address.

A naive check like `email.includes('@')` passes values like `user@example.com?bcc=spam@target.com`.

## Solution

Validate the email with a regex that rejects query-string characters:

```typescript
const EMAIL_RE = /^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/;
const contactEmail = rawEmail && EMAIL_RE.test(rawEmail) ? rawEmail : FALLBACK_EMAIL;
```

This rejects:
- Emails with `?` (mailto parameter injection)
- Emails with `&` (additional parameter injection)
- Emails with whitespace (malformed)
- Strings like `@`, `foo@`, `@bar` (missing parts)

## Key Insight

Astro's template auto-escaping prevents XSS in attribute values, so `javascript:` injection through `mailto:` is not possible. The specific risk is mailto parameter injection, which is a different attack vector — it manipulates the mail client, not the browser's JavaScript engine. The defense must be at the data validation layer, not the rendering layer.

## Prevention

- Never interpolate unvalidated strings into `mailto:` hrefs
- Reject `?`, `&`, and whitespace in email values from external APIs
- Always provide a hardcoded fallback email constant
- Same principle applies to `tel:` links with phone numbers from APIs
