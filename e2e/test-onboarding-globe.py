"""
Smoke test for new onboarding page + landing globe section.
Server expected running on http://localhost:3000.
"""
import sys
from playwright.sync_api import sync_playwright


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        console_msgs: list[str] = []
        page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_msgs.append(f"[pageerror] {err}"))

        # 1. Landing page
        print("LOAD: http://localhost:3000")
        page.goto("http://localhost:3000", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle", timeout=30000)
        page.screenshot(path="C:/Users/hansg/AppData/Local/Temp/zerogig-landing-top.png", full_page=False)
        print("  saved zerogig-landing-top.png")

        community_heading = page.locator("text=The Agentic Economy is Going Global").first
        try:
            community_heading.wait_for(timeout=10000)
            community_heading.scroll_into_view_if_needed()
            page.wait_for_timeout(2000)
            page.screenshot(path="C:/Users/hansg/AppData/Local/Temp/zerogig-landing-globe.png", full_page=False)
            print("  OK CommunityGlobe heading found")
        except Exception as e:
            print(f"  FAIL CommunityGlobe heading not visible: {e}")
            page.screenshot(path="C:/Users/hansg/AppData/Local/Temp/zerogig-landing-globe-err.png", full_page=True)
            return 1

        for label in ["Total Sign-ups", "Countries", "Clients", "Agent Owners"]:
            cnt = page.locator(f"text={label}").count()
            print(f"  stat label '{label}' present: {cnt > 0}")

        canvas_count = page.locator("canvas").count()
        print(f"  canvas elements (globe): {canvas_count}")

        for label in ["Top Countries", "Preferred Models", "Join the Community"]:
            cnt = page.locator(f"text={label}").count()
            print(f"  panel '{label}' present: {cnt > 0}")

        # 2. Onboarding page
        print("\nLOAD: http://localhost:3000/onboarding")
        page.goto("http://localhost:3000/onboarding", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle", timeout=30000)
        page.screenshot(path="C:/Users/hansg/AppData/Local/Temp/zerogig-onboarding-step1.png", full_page=False)
        print("  saved zerogig-onboarding-step1.png")

        try:
            page.wait_for_selector("text=Welcome to zer0Gig.", timeout=5000)
            print("  OK Step 1 (Welcome) renders")
        except Exception as e:
            print(f"  FAIL Step 1 missing: {e}")
            return 1

        for label in ["Connect", "Profile", "AI Model", "Confirm"]:
            cnt = page.locator(f"text={label}").count()
            print(f"  step '{label}' label present: {cnt > 0}")

        connect_btn = page.locator("button:has-text('Connect Wallet')")
        print(f"  connect button present: {connect_btn.count() > 0}")

        # 3. Console errors
        errors = [m for m in console_msgs if "[error]" in m.lower() or "[pageerror]" in m.lower()]
        warnings = [m for m in console_msgs if "[warning]" in m.lower() and m not in errors]
        if errors:
            print("\nBROWSER ERRORS:")
            for m in errors[:25]:
                # Strip non-ascii to avoid cp1252 errors when printing
                print(f"  {m.encode('ascii', 'replace').decode('ascii')}")
        print(f"\ntotal: {len(console_msgs)} msgs ({len(errors)} errors, {len(warnings)} warnings)")

        browser.close()
        return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main())
