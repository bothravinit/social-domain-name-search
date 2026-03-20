import { test, expect, type Page, type Locator } from "@playwright/test";

// "google" exists on every major platform
const KNOWN_TAKEN = "google";
// Random string that should not be registered anywhere
const KNOWN_FREE = "notexist-xkcd-404";

// Platforms using official APIs — results are deterministic
const RELIABLE: string[] = ["github", "reddit"];

// Platforms that always return unknown by design (bot detection / region blocks)
const ALWAYS_UNKNOWN: string[] = ["tiktok", "x"];

// Scrape-based platforms — can return taken or unknown depending on bot detection
const SCRAPE_BASED: string[] = ["instagram", "facebook", "youtube", "linkedin", "pinterest"];

const ALL_PLATFORMS = [...RELIABLE, ...ALWAYS_UNKNOWN, ...SCRAPE_BASED];

// --- helpers ---

async function searchUsername(page: Page, username: string) {
  await page.fill('input[placeholder="yourusername"]', username);
  await page.click('button[type="submit"]');
  // Button re-enables once isSearching flips back to false (all Promise.all resolved)
  await expect(page.getByRole("button", { name: "Check" })).toBeEnabled({
    timeout: 45_000,
  });
}

function card(page: Page, platformId: string): Locator {
  return page.locator(`[data-testid="card-${platformId}"]`);
}

async function cardStatus(
  page: Page,
  platformId: string
): Promise<"available" | "taken" | "unknown"> {
  const c = card(page, platformId);
  if (await c.getByText("Available", { exact: true }).isVisible()) return "available";
  if (await c.getByText("Taken", { exact: true }).isVisible()) return "taken";
  return "unknown";
}

// --- tests ---

test.describe("social handle check — social channel integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ── UI smoke tests ──────────────────────────────────────────────────────────

  test("homepage loads and shows all 9 platform pills", async ({ page }) => {
    const expectedNames = [
      "Instagram", "TikTok", "X (Twitter)", "Facebook", "YouTube",
      "LinkedIn", "Reddit", "GitHub", "Pinterest",
    ];
    for (const name of expectedNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test("all 9 platform cards render after search", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    for (const id of ALL_PLATFORMS) {
      await expect(card(page, id)).toBeVisible();
    }
  });

  test("no card is stuck in checking state after search completes", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    for (const id of ALL_PLATFORMS) {
      await expect(card(page, id).getByText("Checking")).not.toBeVisible();
    }
  });

  test("summary bar shows taken + available counts", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    // At least one platform shows "taken" for a well-known username
    await expect(page.getByText(/\d+ available/)).toBeVisible();
    await expect(page.getByText(/\d+ taken/)).toBeVisible();
  });

  // ── Reliable platforms (official APIs) ─────────────────────────────────────

  test("GitHub → taken for existing username (google)", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    await expect(card(page, "github").getByText("Taken", { exact: true })).toBeVisible();
  });

  test("GitHub → available for non-existent username", async ({ page }) => {
    await searchUsername(page, KNOWN_FREE);
    await expect(card(page, "github").getByText("Available", { exact: true })).toBeVisible();
  });

  test("Reddit → taken for existing username (google)", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    await expect(card(page, "reddit").getByText("Taken", { exact: true })).toBeVisible();
  });

  test("Reddit → available for non-existent username", async ({ page }) => {
    await searchUsername(page, KNOWN_FREE);
    await expect(card(page, "reddit").getByText("Available", { exact: true })).toBeVisible();
  });

  // ── Always-unknown platforms (by design) ───────────────────────────────────

  test("TikTok → always shows Verify link (unknown by design)", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    await expect(card(page, "tiktok").getByText("Verify", { exact: true })).toBeVisible();
  });

  test("X (Twitter) → always shows Verify link (unknown by design)", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    await expect(card(page, "x").getByText("Verify", { exact: true })).toBeVisible();
  });

  // ── Scrape-based platforms — resolve to taken or unknown, never stuck ───────

  for (const id of SCRAPE_BASED) {
    test(`${id} → resolves to taken or unknown for 'google' (not stuck)`, async ({ page }) => {
      await searchUsername(page, KNOWN_TAKEN);
      const status = await cardStatus(page, id);
      expect(["taken", "unknown"]).toContain(status);
    });
  }

  // ── Profile URL links ───────────────────────────────────────────────────────

  test("GitHub card links to correct profile URL", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    const link = card(page, "github").getByRole("link").first();
    await expect(link).toHaveAttribute("href", `https://github.com/${KNOWN_TAKEN}`);
  });

  test("Reddit card links to correct profile URL", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    const link = card(page, "reddit").getByRole("link").first();
    await expect(link).toHaveAttribute("href", `https://reddit.com/u/${KNOWN_TAKEN}`);
  });

  test("TikTok Verify link points to correct profile URL", async ({ page }) => {
    await searchUsername(page, KNOWN_TAKEN);
    const link = card(page, "tiktok").getByText("Verify");
    await expect(link).toHaveAttribute("href", `https://tiktok.com/@${KNOWN_TAKEN}`);
  });

  // ── Input behaviour ─────────────────────────────────────────────────────────

  test("spaces are stripped from username input", async ({ page }) => {
    await page.fill('input[placeholder="yourusername"]', "go ogle");
    const value = await page.inputValue('input[placeholder="yourusername"]');
    expect(value).toBe("google");
  });

  test("submit button is disabled while search is in progress", async ({ page }) => {
    await page.fill('input[placeholder="yourusername"]', KNOWN_TAKEN);
    await page.click('button[type="submit"]');
    // Immediately after click, button should be disabled
    await expect(page.getByRole("button", { name: "Checking…" })).toBeDisabled();
    // Wait for it to re-enable
    await expect(page.getByRole("button", { name: "Check" })).toBeEnabled({ timeout: 45_000 });
  });
});
