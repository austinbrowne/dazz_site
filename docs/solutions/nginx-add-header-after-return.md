---
title: "Nginx add_header After return Is Silently Ignored"
category: "configuration"
tags: ["nginx", "docker", "headers", "debugging"]
severity: "medium"
date: "2026-02-08"
---

# Nginx add_header After return Is Silently Ignored

## Problem

Nginx health check endpoint returns 200 but the `Content-Type` header is not set:

```nginx
location /health {
    return 200 "ok";
    add_header Content-Type text/plain;  # NEVER EXECUTED
}
```

## Root Cause

Nginx's `return` directive immediately sends the response and terminates processing of the location block. Any `add_header` directives placed after `return` are never reached. No warning or error is logged.

## Fix

Use `default_type` instead, which is applied before the `return` directive:

```nginx
location /health {
    default_type text/plain;
    return 200 "ok";
}
```

## Gotchas

- This is completely silent -- no error in nginx logs, no warning during `nginx -t` config test
- The response still returns 200 with body "ok", so basic health checks pass -- only the Content-Type header is wrong
- Same issue applies to any `add_header` placed after `return` in any location block
- Related: `add_header` directives in a `server` block DO apply to `return` responses, but `add_header` within the same `location` block after `return` does not
