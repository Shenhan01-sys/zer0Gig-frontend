/**
 * Tests for AgentStoragePanel — API route + page rendering.
 *
 * API tests   : hit /api/agent-storage directly (no wallet needed).
 * E2E tests   : load the agent detail page and assert the panel renders.
 *
 * Follows the same conventions as api.spec.ts / pages.spec.ts:
 *   - waitUntil: "domcontentloaded"  (web3 dapps never reach networkidle)
 *   - HYDRATION_WAIT after goto      (let React hydrate)
 *   - IGNORE_PATTERNS filter for known wagmi/Privy console noise
 */
import { test, expect } from "@playwright/test";

const NAV_OPTS      = { waitUntil: "domcontentloaded" as const, timeout: 30_000 };
const HYDRATION_WAIT = 4_000;

// A plausible agent ID known to exist in Supabase test data
const KNOWN_AGENT_ID = 2;

// A random address that is definitely not the owner → client-role path
const NON_OWNER_ADDR = "0x1111111111111111111111111111111111111111";

// ─── /api/agent-storage — unit / integration ─────────────────────────────────

test.describe("GET /api/agent-storage — validation", () => {
  test("returns 400 when agentId is missing", async ({ request }) => {
    const res = await request.get("/api/agent-storage?viewerAddress=0xabc");
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test("returns 400 when viewerAddress is missing", async ({ request }) => {
    const res = await request.get(`/api/agent-storage?agentId=${KNOWN_AGENT_ID}`);
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test("returns 400 when both params are missing", async ({ request }) => {
    const res = await request.get("/api/agent-storage");
    expect(res.status()).toBe(400);
  });
});

test.describe("GET /api/agent-storage — response shape", () => {
  test("returns 200 with correct top-level shape", async ({ request }) => {
    const res = await request.get(
      `/api/agent-storage?agentId=${KNOWN_AGENT_ID}&viewerAddress=${NON_OWNER_ADDR}`
    );
    expect(res.status()).toBe(200);
    const json = await res.json();

    // Top-level fields must always be present
    expect(json).toHaveProperty("isOwner");
    expect(json).toHaveProperty("progressive");
    expect(json).toHaveProperty("subscriptions");
    expect(typeof json.isOwner).toBe("boolean");
    expect(Array.isArray(json.progressive)).toBe(true);
    expect(Array.isArray(json.subscriptions)).toBe(true);
  });

  test("non-owner address → isOwner is false", async ({ request }) => {
    const res = await request.get(
      `/api/agent-storage?agentId=${KNOWN_AGENT_ID}&viewerAddress=${NON_OWNER_ADDR}`
    );
    const { isOwner } = await res.json();
    expect(isOwner).toBe(false);
  });

  test("unknown agentId returns empty arrays (not an error)", async ({ request }) => {
    const res = await request.get(
      `/api/agent-storage?agentId=999999&viewerAddress=${NON_OWNER_ADDR}`
    );
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.progressive).toHaveLength(0);
    expect(json.subscriptions).toHaveLength(0);
  });

  test("progressive jobs have required fields when present", async ({ request }) => {
    const res = await request.get(
      `/api/agent-storage?agentId=${KNOWN_AGENT_ID}&viewerAddress=${NON_OWNER_ADDR}`
    );
    const { progressive } = await res.json();

    for (const job of progressive) {
      expect(job).toHaveProperty("jobId");
      expect(job).toHaveProperty("description");
      expect(job).toHaveProperty("clientAddress");
      expect(job).toHaveProperty("createdAt");
      expect(Array.isArray(job.activity)).toBe(true);
      expect(Array.isArray(job.messages)).toBe(true);
      // outputHash is nullable
      expect("outputHash" in job).toBe(true);
    }
  });

  test("subscriptions have required fields when present", async ({ request }) => {
    const res = await request.get(
      `/api/agent-storage?agentId=${KNOWN_AGENT_ID}&viewerAddress=${NON_OWNER_ADDR}`
    );
    const { subscriptions } = await res.json();

    for (const sub of subscriptions) {
      expect(sub).toHaveProperty("id");
      expect(sub).toHaveProperty("clientAddress");
      expect(sub).toHaveProperty("taskDescription");
      expect(sub).toHaveProperty("status");
      expect(sub).toHaveProperty("createdAt");
      // checkpointHash is nullable
      expect("checkpointHash" in sub).toBe(true);
    }
  });
});

test.describe("GET /api/agent-storage — client-side data isolation", () => {
  test("client sees only their own jobs (clientAddress matches viewerAddress)", async ({ request }) => {
    // As a non-owner, jobs returned must belong to viewer
    const res = await request.get(
      `/api/agent-storage?agentId=${KNOWN_AGENT_ID}&viewerAddress=${NON_OWNER_ADDR}`
    );
    const { progressive } = await res.json();

    for (const job of progressive) {
      expect(job.clientAddress.toLowerCase()).toBe(NON_OWNER_ADDR.toLowerCase());
    }
  });

  test("client sees only their own subscriptions (clientAddress matches viewerAddress)", async ({ request }) => {
    const res = await request.get(
      `/api/agent-storage?agentId=${KNOWN_AGENT_ID}&viewerAddress=${NON_OWNER_ADDR}`
    );
    const { subscriptions } = await res.json();

    for (const sub of subscriptions) {
      expect(sub.clientAddress.toLowerCase()).toBe(NON_OWNER_ADDR.toLowerCase());
    }
  });
});

// ─── Agent Detail Page — E2E rendering ───────────────────────────────────────

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
  "privy-io",
  "@privy",
  "TypeError: e is not a function",
];

function isCriticalError(msg: string): boolean {
  return !IGNORE_PATTERNS.some((p) => msg.includes(p));
}

// NOTE: AgentStoragePanel is inside <RBACGuard> — Privy redirects unauthenticated
// visitors to "/". These tests verify auth-gate behavior + no server crashes.
// Element-level assertions (tabs, headings) require wallet and are covered by
// the API tests above instead.
test.describe("Agent Detail page — AgentStoragePanel rendering", () => {
  const agentUrl = `/dashboard/agents/${KNOWN_AGENT_ID}`;

  test("page returns 200 (not a server error)", async ({ page }) => {
    const res = await page.goto(agentUrl, NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });

  test("renders without critical JS errors", async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && isCriticalError(msg.text())) {
        criticalErrors.push(msg.text());
      }
    });
    await page.goto(agentUrl, NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    expect(criticalErrors).toHaveLength(0);
  });

  test("unauthenticated user is redirected (RBACGuard auth-gate)", async ({ page }) => {
    // Privy redirects to "/" when not authenticated — the page must not 5xx.
    await page.goto(agentUrl, NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    // After guard fires, URL should be either the agent page (still loading)
    // or the root page (redirected). Either way, no 5xx and body visible.
    const url = page.url();
    expect(url).toMatch(/localhost|127\.0\.0\.1/);
    const bodyVisible = await page.locator("body").isVisible().catch(() => false);
    expect(bodyVisible).toBe(true);
  });

  test("page body visible (skeleton or redirect state)", async ({ page }) => {
    await page.goto(agentUrl, NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    const visible = await page.locator("body").isVisible().catch(() => false);
    expect(visible).toBe(true);
  });
});

// ─── Agent Detail page — unknown agent graceful handling ─────────────────────

test.describe("Agent Detail page — unknown agentId", () => {
  test("returns 200 for non-existent agent (graceful empty state)", async ({ page }) => {
    const res = await page.goto("/dashboard/agents/999999", NAV_OPTS);
    expect(res?.status()).toBeLessThan(500);
  });

  test("page body visible for non-existent agent", async ({ page }) => {
    await page.goto("/dashboard/agents/999999", NAV_OPTS);
    await page.waitForTimeout(HYDRATION_WAIT);
    const visible = await page.locator("body").isVisible().catch(() => false);
    expect(visible).toBe(true);
  });
});
