import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 8000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type Status = "available" | "taken" | "unknown";

// GitHub has an official API - most reliable check
async function checkGitHub(username: string): Promise<Status> {
  const res = await fetchWithTimeout(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 200) return "taken";
  if (res.status === 404) return "available";
  return "unknown";
}

// Reddit has a JSON API endpoint
async function checkReddit(username: string): Promise<Status> {
  const res = await fetchWithTimeout(
    `https://www.reddit.com/user/${username}/about.json`,
    { headers: BROWSER_HEADERS }
  );
  if (res.status === 200) return "taken";
  if (res.status === 404) return "available";
  return "unknown";
}

// Read first N bytes of body safely without consuming the full stream
async function peekBody(res: Response, bytes = 15000): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, bytes);
  } catch {
    return "";
  }
}

// Instagram: sending a browser User-Agent triggers a login shell with no og:title
// for ALL profiles. Sending no UA (or a bot UA) gets the full SEO page —
// existing profiles include og:title, non-existing don't.
async function checkInstagram(username: string): Promise<Status> {
  const res = await fetchWithTimeout(`https://www.instagram.com/${username}/`, {
    headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    redirect: "follow",
  });
  if (res.status === 404) return "available";
  if (res.status === 200) {
    const body = await peekBody(res);
    if (body.includes("og:title")) return "taken";
    return "available";
  }
  return "unknown";
}

// TikTok is blocked in several regions (e.g. India), making server-side checks
// unreliable — a blocked request looks identical to a non-existent profile.
async function checkTikTok(_username: string): Promise<Status> {
  return "unknown";
}

// X serves identical 200 responses regardless of whether the profile exists.
async function checkX(_username: string): Promise<Status> {
  return "unknown";
}

// Facebook: same trick as Instagram — no User-Agent gets the full OG page.
// Existing profiles have og:title; non-existing profiles don't.
async function checkFacebook(username: string): Promise<Status> {
  const res = await fetchWithTimeout(`https://www.facebook.com/${username}`, {
    headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    redirect: "follow",
  });
  if (res.status === 404) return "available";
  if (res.status === 200) {
    const body = await peekBody(res);
    if (body.includes("og:title")) return "taken";
    return "available";
  }
  return "unknown";
}

// Pinterest: check by body — non-existent profiles show a not-found indicator.
async function checkPinterest(username: string): Promise<Status> {
  const res = await fetchWithTimeout(`https://www.pinterest.com/${username}/`, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });
  if (res.status === 404) return "available";
  if (res.url.includes("login")) return "unknown";
  if (res.status === 200) {
    const body = await peekBody(res);
    // Non-existent profiles show an error; existing ones have profile metadata
    if (body.includes('"og:title"') && body.toLowerCase().includes(username.toLowerCase())) return "taken";
    if (body.includes("Sorry, we couldn") || body.includes("page you were looking")) return "available";
    return "unknown";
  }
  return "unknown";
}

// YouTube @handle pages return 404 for non-existent channels
async function checkYouTube(username: string): Promise<Status> {
  const res = await fetchWithTimeout(`https://www.youtube.com/@${username}`, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });
  if (res.status === 404) return "available";
  if (res.status === 200) return "taken";
  return "unknown";
}

// LinkedIn redirects to authwall for non-logged-in users; 404 means available
async function checkLinkedIn(username: string): Promise<Status> {
  const res = await fetchWithTimeout(`https://www.linkedin.com/in/${username}/`, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });
  if (res.status === 404) return "available";
  if (res.url.includes("authwall") || res.url.includes("login")) return "unknown";
  if (res.status === 200) return "taken";
  return "unknown";
}

const checkers: Record<string, (username: string) => Promise<Status>> = {
  instagram: checkInstagram,
  tiktok: checkTikTok,
  x: checkX,
  facebook: checkFacebook,
  youtube: checkYouTube,
  linkedin: checkLinkedIn,
  reddit: checkReddit,
  github: checkGitHub,
  pinterest: checkPinterest,
};

const USERNAME_RE = /^[a-zA-Z0-9._\-]{1,50}$/;

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim();
  const platform = req.nextUrl.searchParams.get("platform");

  if (!username || !platform) {
    return NextResponse.json({ error: "Missing username or platform" }, { status: 400 });
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ status: "unknown", error: "Invalid username format" });
  }

  const checker = checkers[platform];
  if (!checker) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  try {
    const status = await checker(username);
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
