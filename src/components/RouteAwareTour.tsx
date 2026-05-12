"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import GuidedTour from "./GuidedTour";
import { TOURS, tourKeyForLocation } from "@/lib/tours";

// ─────────────────────────────────────────────────────────────────────────────
// RouteAwareTour — single mount point that picks the right tour based on
// the current pathname AND ?tab= query (so /dashboard?tab=subscriptions
// loads a different tour than /dashboard).
//
// Mount once in AppNavbar — every page rendering the navbar gets the right
// tour automatically, auto-opens on first visit, re-opens via the Guide
// button. Returns null on routes with no configured tour.
// ─────────────────────────────────────────────────────────────────────────────

export default function RouteAwareTour() {
  const pathname     = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tab          = searchParams?.get("tab") ?? null;
  const key          = useMemo(() => tourKeyForLocation(pathname, tab), [pathname, tab]);
  if (!key) return null;
  const def = TOURS[key];
  if (!def) return null;
  // Remount when key changes so the auto-open effect fires for each new
  // tour (including tab switches within /dashboard).
  return (
    <GuidedTour
      key={key}
      tourKey={key}
      badge={def.badge}
      steps={def.steps}
    />
  );
}
