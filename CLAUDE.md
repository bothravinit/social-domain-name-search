# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint via next lint
```

No test suite is configured.

## Architecture

This is a Next.js 15 (App Router) app with a single-page UI and one API route.

**Data flow:**
1. User types a username in `app/page.tsx`
2. `handleSearch` fires all platform checks in parallel via `Promise.all`
3. Each check hits `/api/check?username=&platform=` (`app/api/check/route.ts`)
4. The API route calls the appropriate per-platform checker function and returns `{ status: "available" | "taken" | "unknown" }`
5. Results stream back independently — each card updates as its own fetch resolves

**Key files:**
- `lib/platforms.ts` — Source of truth for all platform definitions (id, name, color, svgPath, profileUrl). Add new platforms here first.
- `app/api/check/route.ts` — All server-side checking logic lives here. Each platform has its own function. GitHub and Reddit use official APIs; others use HTTP status codes and OG meta scraping.
- `components/PlatformCard.tsx` — Renders a single platform result card. Handles all 5 status states: `idle | checking | available | taken | unknown`.

## Adding a new platform

1. Add an entry to the `platforms` array in `lib/platforms.ts`
2. Write a `check<Platform>(username)` function in `app/api/check/route.ts` returning `"available" | "taken" | "unknown"`
3. Register it in the `checkers` map at the bottom of that file

## Checking strategy notes

- **GitHub / Reddit**: Use official APIs — most reliable
- **Instagram / Facebook**: Omit browser User-Agent to get full OG meta page; presence of `og:title` = taken
- **TikTok / X**: Return `"unknown"` — server-side checks are not viable (bot detection / region blocks)
- All checkers use an 8-second `AbortController` timeout
- Username input is validated against `/^[a-zA-Z0-9._\-]{1,50}$/` before any request is made
