"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import GuidedTour from "./GuidedTour";
import { TOURS, tourKeyForPath } from "@/lib/tours";

// ─────────────────────────────────────────────────────────────────────────────
// RouteAwareTour — single mount point that picks the right tour based on the
// current pathname. Drop into any layout component that wraps multiple
// pages and every page that has a matching entry in PATH_TO_TOUR gets its
// tour automatically (auto-open on first visit + re-openable via the
// Guide button in AppNavbar).
//
// Returns null if the current route has no tour configured.
// ─────────────────────────────────────────────────────────────────────────────

export default function RouteAwareTour() {
  const pathname = usePathname() ?? "";
  const key = useMemo(() => tourKeyForPath(pathname), [pathname]);
  if (!key) return null;
  const def = TOURS[key];
  if (!def) return null;
  // Remount when key changes so the auto-open effect fires for each new page
  return (
    <GuidedTour
      key={key}
      tourKey={key}
      badge={def.badge}
      steps={def.steps}
    />
  );
}
