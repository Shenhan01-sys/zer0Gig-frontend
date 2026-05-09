// Visual sanity check for AgentWorkflow section.
// Takes a screenshot of the section after scrolling to it. Not a strict
// regression — just a way to inspect the rendering before pushing.
import { test } from "@playwright/test";

test("snapshot AgentWorkflow section", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.setViewportSize({ width: 1920, height: 1200 });

  const heading = page.locator("text=Agents that actually");
  await heading.waitFor({ state: "visible", timeout: 20_000 });

  // Scroll PAST the section first so every node card crosses the viewport
  // (framer-motion whileInView uses once: true and triggers on first cross).
  const caption = page.locator("text=cycle ≈ 14s").first();
  await caption.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Now scroll back up so the heading is at the top of the viewport for the shot
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);

  // Find the AgentWorkflow outer container (it's the div with the
  // `max-w-[1100px]` CSS class) — this includes both SVG layers + cards.
  const workflowContainer = page.locator(".max-w-\\[1100px\\]").first();
  await workflowContainer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const box = await workflowContainer.boundingBox();
  if (!box) throw new Error("workflow container not found");

  await page.screenshot({
    path: "test-results/agent-workflow.png",
    clip: {
      x: Math.max(0, box.x - 60),
      y: Math.max(0, box.y - 40),
      width: box.width + 120,
      height: box.height + 100,
    },
  });
});
