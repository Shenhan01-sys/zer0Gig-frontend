import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border",
  {
    variants: {
      variant: {
        default:   "bg-white/[0.07] text-white/65 border-white/[0.1]",
        secondary: "bg-white/[0.04] text-white/35 border-white/[0.06]",
        outline:   "bg-transparent text-white/50 border-white/[0.15] hover:border-white/[0.25] hover:text-white/70",
        skill:     "bg-[#38bdf8]/[0.08] text-[#38bdf8]/80 border-[#38bdf8]/[0.2]",
        success:   "bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/[0.2]",
        warning:   "bg-amber-500/[0.1] text-amber-400 border-amber-500/[0.2]",
        error:     "bg-red-500/[0.08] text-red-400 border-red-500/[0.18]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
