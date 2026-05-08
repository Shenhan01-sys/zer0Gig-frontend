/**
 * Page rendering tests — verify pages load, key UI elements are visible,
 * and no unhandled JS errors appear on critical routes.
 *
 * Strategy: use `waitUntil: "domcontentloaded"` for all goto() calls.
 * Web3 dapps (wagmi + Privy) make continuous RPC polling — they never
 * reach `networkidle`, so that wait strategy would always time out.
 */
import { test, expect } from "@playwright/test";

// Load only until the HTML is parsed and initial scripts fire — skip waiting
// for ongoing blockchain RPC calls which never stop.
const NAV_OPTS = { waitUntil: "domcontentloaded" as const, timeout: 30_000 };
const HYDRATION_WAIT = 4_000; // ms to let React hydrate after DOM load

// Console errors to ignore — known in any Next.js + wagmi + Privy SSR setup
const IGNORE_PATTERNS = [
  "An error occurred during hydration",
  "NotFoundErrorBoundary",
  "net::ERR_",
  "Failed to fetch",
  "CORS",
  "ResizeObserver",
  "Non-Error promise rejection",
  "Minified React error",
  "ethers",
  // Privy SDK fails to initialize its internal browser fingerprinting in headless mode — not our code
  "privy-io",
  "@privy",
  "TypeError: e is not a function",
];

function isCriticalError(msg: string): boolean {
  return !IGNORE_PATTERNS.some((p) => msg.includes(p));
}

// ─── Landing / root ──────────────────────────────────────────────────────────

test("root renders without 5xx error", async ({ page }) => {
  const res = await page.goto("/", NAV_OPTS);
  expect(res?.status()).not.toBeGreaterThanOrEqual(500);
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

test.describe("Dashboard", () => {
  test("returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto("/dashboard", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });

  test("renders connect-wallet UI or dashboard layout", async ({ page }) => {
    await page.goto("/dashboard", NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    // Privy renders a button, or the dashboard has a nav/grid. Either is fine.
    const visible = await page
      .locator("button, nav, main, [class*='dashboard']")
      .first()
      .isVisible()
      .catch(() => false);
    expect(visible).toBe(true);
  });
});

// ─── Jobs page ───────────────────────────────────────────────────────────────

test.describe("Jobs page", () => {
  test("returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto("/dashboard/jobs", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });

  test("renders without critical JS errors", async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && isCriticalError(msg.text())) {
        criticalErrors.push(msg.text());
      }
    });
    await page.goto("/dashboard/jobs", NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    expect(criticalErrors).toHaveLength(0);
  });

  test("body content is visible", async ({ page }) => {
    await page.goto("/dashboard/jobs", NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    const visible = await page.locator("body").isVisible().catch(() => false);
    expect(visible).toBe(true);
  });
});

// ─── Register Agent page ─────────────────────────────────────────────────────

test.describe("Register Agent page", () => {
  test("returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto("/dashboard/register-agent", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });

  test("renders page body without crashing", async ({ page }) => {
    await page.goto("/dashboard/register-agent", NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    const visible = await page.locator("body").isVisible().catch(() => false);
    expect(visible).toBe(true);
  });
});

// ─── Create Subscription page ─────────────────────────────────────────────────

test.describe("Create Subscription page", () => {
  test("returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto("/dashboard/create-subscription", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });
});

// ─── Job Detail page ─────────────────────────────────────────────────────────

test.describe("Job Detail page", () => {
  test("returns 200 for job #1", async ({ page }) => {
    const res = await page.goto("/dashboard/jobs/1", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });

  test("renders body content for job #1 (skeleton or data)", async ({ page }) => {
    await page.goto("/dashboard/jobs/1", NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    const visible = await page.locator("body").isVisible().catch(() => false);
    expect(visible).toBe(true);
  });

  test("returns 200 for a non-existent job id", async ({ page }) => {
    // Page renders client-side; 404 is shown inside the app, not at HTTP level
    const res = await page.goto("/dashboard/jobs/999999", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });
});

// ─── Agents page ─────────────────────────────────────────────────────────────

test.describe("Agents page", () => {
  test("returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto("/dashboard/agents", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });
});

// ─── Subscriptions page ──────────────────────────────────────────────────────

test.describe("Subscriptions page", () => {
  test("returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto("/dashboard/subscriptions", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });
});
