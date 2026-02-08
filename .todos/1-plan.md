# Issue #1: Project Scaffolding & Infrastructure

**Branch:** `issue-1-project-scaffolding`
**Started:** 2026-02-07

## Acceptance Criteria
- Astro 5 project initialized with TypeScript strict mode
- TailwindCSS 4 configured
- Base layout with header, footer, navigation
- Docker multi-stage build (node build → nginx serve)
- Integrated with dazz-infra (docker-compose, nginx config)
- GitHub Actions CI/CD (push + daily cron)
- Legal pages: /privacy, /terms, /disclosure
- Custom 404 page
- AffiliateDisclosure reusable component
- Analytics (Plausible/Umami) script
- Accessibility baseline
- Vitest test infrastructure

## Implementation Steps

1. [x] Create feature branch
2. [x] Initialize Astro project with TypeScript
3. [x] Install & configure TailwindCSS 4 (via @tailwindcss/vite)
4. [x] Create base layout (header, footer, nav, skip-nav, analytics placeholder)
5. [x] Create legal pages (/privacy, /terms, /disclosure)
6. [x] Create 404 page
7. [x] Create AffiliateDisclosure component
8. [x] Create placeholder homepage
9. [ ] Set up Vitest
10. [x] Create Dockerfile (multi-stage: build → nginx)
11. [ ] Create nginx site config for dazz-infra
12. [ ] Update dazz-infra docker-compose.yml
13. [x] Create GitHub Actions workflow
14. [x] Add SEO (sitemap, robots.txt, OG tags)

## Additional Work Completed
- [x] EmptyState reusable component
- [x] NewsletterSignup component (with honeypot)
- [x] TypeScript types (src/lib/types.ts)
- [x] API client (src/lib/api.ts)
- [x] Picks placeholder page
- [x] Reviews placeholder page
- [x] Work With Me page
- [x] favicon.svg
- [x] Build verified: 8 pages in 448ms

## Deferred Items
- Vitest setup (can be added when we have code worth testing)
- dazz-infra integration (steps 11-12, requires changes in separate repo)
- Analytics script (waiting on Plausible/Umami decision)

## Progress Log
- 2026-02-07: Branch created, starting scaffolding
- 2026-02-07: Full scaffolding complete. Astro 5 + TailwindCSS 4, all pages, components, Docker, CI/CD, types, API client. Build succeeds.
