"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

/**
 * OnboardingGate — strict gate for the landing page.
 *
 * Behaviour:
 *  - If sessionStorage 'zerogig:onboarding:completed' === '1' (set by
 *    /onboarding right before redirecting back to /) → never redirect.
 *    Replaces the old ?welcome=1 URL flag so the landing URL stays clean.
 *  - If `?skip=true` is in the URL → never redirect for this visit
 *    (sessionStorage flag).
 *  - If the visitor hasn't passed the /partnership gate yet → push there.
 *  - If they passed partnership but haven't completed /onboarding → push there.
 *  - Once a wallet is found in Supabase, the gate stays open for that session.
 *
 * Renders nothing visually. Drop into the root page.
 */
export default function OnboardingGate() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, authenticated, user } = usePrivy();

  // Avoid double-firing the redirect (Privy ready toggles)
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (!ready) return;

    // Honor explicit bypass flags.
    // - 'zerogig:onboarding:completed' — set by /onboarding right before
    //   redirecting back to /, replaces the old ?welcome=1 URL flag (no
    //   query-string clutter in the landing URL).
    // - ?skip=true / 'zerogig:onboarding-skipped' — opt-out for power users
    //   who don't want to be funneled.
    try {
      if (sessionStorage.getItem("zerogig:onboarding:completed") === "1") return;
    } catch {}
    if (params.get("skip") === "true") {
      try { sessionStorage.setItem("zerogig:onboarding-skipped", "1"); } catch {}
      return;
    }
    try {
      if (sessionStorage.getItem("zerogig:onboarding-skipped") === "1") return;
    } catch {}

    // Check if visitor has passed the partnership gate (either submitted the
    // form or clicked 'Continue as Individual'). If not — route there first.
    let partnershipPassed = false;
    try {
      partnershipPassed = sessionStorage.getItem("zerogig:partnership:passed") === "1";
    } catch {}

    const wallet = (user?.wallet?.address ?? "").toLowerCase();

    // Not authenticated yet — push through the partnership gate first, then onboarding.
    if (!authenticated || !wallet) {
      fired.current = true;
      router.replace(partnershipPassed ? "/onboarding" : "/partnership");
      return;
    }

    // Authenticated → check whether wallet has already signed up.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/signup?wallet=${wallet}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.ok && !json.exists) {
          fired.current = true;
          // Even for already-authenticated wallets that haven't signed up,
          // still send them through the partnership gate first.
          router.replace(partnershipPassed ? "/onboarding" : "/partnership");
        }
      } catch {
        // Network failure — leave the landing visible rather than redirect to a
        // potentially broken state.
      }
    })();
    return () => { cancelled = true; };
  }, [ready, authenticated, user, router, params]);

  return null;
}
