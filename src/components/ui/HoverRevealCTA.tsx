"use client";

/**
 * HoverRevealCTA — small inline link that lives at the bottom of a card and
 * reveals (fade + slide-up) when the parent `.group` is hovered.
 *
 * Mirrors the calm, confident pattern used on pc.0g.ai/sdk/playground:
 * cards have an almost-invisible idle border that brightens on hover, and a
 * secondary CTA slides into view at the bottom. No rotating gradients, no
 * shine sweeps, no bouncy springs — just a measured 300ms ease-out.
 *
 * Use inside any element that already declares `className="group"` and the
 * recommended hover treatment (border brighten + small translate-y lift).
 */

import Link from "next/link";

interface HoverRevealCTAProps {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
}

export default function HoverRevealCTA({
  href,
  label,
  external = false,
  className = "",
}: HoverRevealCTAProps) {
  const linkClasses =
    "inline-flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white transition-colors duration-200";

  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" as const }
    : {};

  return (
    <div
      className={
        "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 " +
        "transition-all duration-300 ease-out " +
        className
      }
    >
      <Link href={href} {...externalProps} className={linkClasses}>
        <span aria-hidden>&rarr;</span>
        <span>{label}</span>
      </Link>
    </div>
  );
}
