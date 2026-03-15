# namecheck

**Check your username across 9 major social platforms — instantly.**

> Live at: [socialdomainname.vercel.app](https://socialdomainname.vercel.app/)

---

## What it does

namecheck lets you type a username once and simultaneously checks its availability across 9 platforms in real time. Cards update as each result comes in — no waiting for all platforms to finish before you see anything.

Useful when you're starting a brand, project, or personal profile and want consistent handles everywhere.

## Platforms checked

| Platform   | Method                          | Reliability |
|------------|---------------------------------|-------------|
| GitHub     | Official GitHub API             | High        |
| Reddit     | Official Reddit JSON API        | High        |
| Instagram  | OG metadata scrape              | Medium      |
| Facebook   | OG metadata scrape              | Medium      |
| YouTube    | `/@handle` HTTP status          | Medium      |
| LinkedIn   | Profile page HTTP status        | Medium      |
| Pinterest  | Profile page + body parse       | Medium      |
| TikTok     | —                               | Unknown*    |
| X (Twitter)| —                               | Unknown*    |

> *TikTok and X serve responses that make server-side availability checks unreliable — results are shown as "unknown" for these platforms.

## How it works

- **Frontend**: Next.js 15 (App Router) with Tailwind CSS. All platform cards fire checks in parallel via `Promise.all` and update independently as results arrive.
- **Backend**: A single Next.js API route (`/api/check`) accepts `?username=&platform=` and runs the appropriate checker server-side. Each checker uses an 8-second timeout.
- **Checking strategy**: GitHub and Reddit use their official APIs (most reliable). Instagram and Facebook checks use a minimal Accept header (no browser User-Agent) to receive full OG meta pages. YouTube checks `/@handle` HTTP status. LinkedIn detects authwall redirects. Pinterest parses body content for profile markers.

## Tech stack

- [Next.js 15](https://nextjs.org/) — App Router, Server-side API routes
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [TypeScript](https://www.typescriptlang.org/)
- Deployed on [Vercel](https://vercel.com/)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys or environment variables required.

## Notes

- Results may vary due to platform bot detection and region-based restrictions (e.g. TikTok is blocked in some regions).
- This tool makes server-side HTTP requests — it does not use browser automation or bypass any login walls.
- Username validation is enforced: only alphanumeric characters, dots, underscores, and hyphens (max 50 chars).
