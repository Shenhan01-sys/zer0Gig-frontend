"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

/**
 * OnboardingGate — strict gate for the landing page.
 *
 * Behaviour:
 *  - If `?welcome=1` is in the URL (just submitted onboarding) → never redirect.
 *  - If `?skip=true` is in the URL → never redirect for this visit (sessionStorage flag).
 *  - If the visitor hasn't seen onboarding yet (no wallet OR wallet not in
 *    Supabase signups) → push them to /onboarding.
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

    // Honor explicit bypass flags
    if (params.get("welcome") === "1") return;
    if (params.get("skip") === "true") {
      try { sessionStorage.setItem("zerogig:onboarding-skipped", "1"); } catch {}
      return;
    }
    try {
      if (sessionStorage.getItem("zerogig:onboarding-skipped") === "1") return;
    } catch {}

    const wallet = (user?.wallet?.address ?? "").toLowerCase();

    // Not authenticated yet — push to onboarding (which will trigger Privy login).
    if (!authenticated || !wallet) {
      fired.current = true;
      router.replace("/onboarding");
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
          router.replace("/onboarding");
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
