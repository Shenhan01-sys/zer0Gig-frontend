/**
 * API Route Tests — hit Next.js API endpoints directly, no wallet needed.
 */
import { test, expect } from "@playwright/test";

// ─── /api/job-brief ──────────────────────────────────────────────────────────

test.describe("GET /api/job-brief", () => {
  test("returns 400 when hash param is missing", async ({ request }) => {
    const res = await request.get("/api/job-brief");
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/hash required/i);
  });

  test("returns {data: null} for non-existent hash", async ({ request }) => {
    const res = await request.get(
      "/api/job-brief?hash=0x" + "0".repeat(64)
    );
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toBeNull();
  });
});

test.describe("POST /api/job-brief", () => {
  test("stores a brief and returns jobDataHash", async ({ request }) => {
    const ts = Date.now();
    const res = await request.post("/api/job-brief", {
      data: {
        title: `Playwright test ${ts}`,
        description: "Write a haiku about decentralized compute.",
        skillId: "0x" + "0".repeat(64),
        clientAddress: "0x0000000000000000000000000000000000000000",
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("jobDataHash");
    expect(json.jobDataHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test("returns stored brief when fetched by hash", async ({ request }) => {
    const ts = Date.now();
    const title = `Round-trip test ${ts}`;
    const description = "Full round-trip test for job brief storage and retrieval.";

    const postRes = await request.post("/api/job-brief", {
      data: { title, description, skillId: "0x" + "0".repeat(64) },
    });
    expect(postRes.status()).toBe(200);
    const { jobDataHash } = await postRes.json();

    const getRes = await request.get(`/api/job-brief?hash=${jobDataHash}`);
    expect(getRes.status()).toBe(200);
    const { data } = await getRes.json();
    expect(data).not.toBeNull();
    expect(data.title).toBe(title);
    expect(data.description).toBe(description);
  });

  test("returns 400 for missing description", async ({ request }) => {
    const res = await request.post("/api/job-brief", {
      data: { title: "No description" },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── /api/oracle/sign-alignment ──────────────────────────────────────────────

test.describe("POST /api/oracle/sign-alignment", () => {
  const validPayload = {
    jobId: "1",
    milestoneIndex: 0,
    alignmentScore: 8500,
    outputHash: "0x" + "a".repeat(64),
  };

  test("returns a valid ECDSA signature for correct input", async ({ request }) => {
    const res = await request.post("/api/oracle/sign-alignment", {
      data: validPayload,
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("signature");
    // ECDSA signatures are 65 bytes = 130 hex chars + 0x prefix = 132 chars
    expect(json.signature).toMatch(/^0x[a-f0-9]{130}$/i);
    expect(json).toHaveProperty("messageHash");
    expect(json.messageHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(json.alignmentScore).toBe(8500);
  });

  test("returns 400 when outputHash is missing", async ({ request }) => {
    const res = await request.post("/api/oracle/sign-alignment", {
      data: { jobId: "1", milestoneIndex: 0, alignmentScore: 8500 },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  test("returns 400 when outputHash is not 32 bytes", async ({ request }) => {
    const res = await request.post("/api/oracle/sign-alignment", {
      data: { ...validPayload, outputHash: "0xdeadbeef" },
    });
    expect(res.status()).toBe(400);
  });

  test("signature is deterministic for same input", async ({ request }) => {
    const [r1, r2] = await Promise.all([
      request.post("/api/oracle/sign-alignment", { data: validPayload }),
      request.post("/api/oracle/sign-alignment", { data: validPayload }),
    ]);
    const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
    expect(j1.signature).toBe(j2.signature);
  });

  test("different jobIds produce different signatures", async ({ request }) => {
    const [r1, r2] = await Promise.all([
      request.post("/api/oracle/sign-alignment", { data: { ...validPayload, jobId: "1" } }),
      request.post("/api/oracle/sign-alignment", { data: { ...validPayload, jobId: "999" } }),
    ]);
    const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
    expect(j1.signature).not.toBe(j2.signature);
    expect(j1.messageHash).not.toBe(j2.messageHash);
  });
});

// ─── /api/agents ─────────────────────────────────────────────────────────────

test.describe("GET /api/agents", () => {
  test("returns 200 and an array", async ({ request }) => {
    const res = await request.get("/api/agents");
    expect(res.status()).toBe(200);
    const json = await res.json();
    // response is either an array or { agents: [] }
    const agents = Array.isArray(json) ? json : json.agents ?? json.data ?? [];
    expect(Array.isArray(agents)).toBe(true);
  });
});
