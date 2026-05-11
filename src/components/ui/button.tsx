import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:     "bg-white text-black hover:bg-white/92 shadow-sm",
        secondary:   "bg-white/[0.07] text-white/70 border border-white/[0.1] hover:bg-white/[0.11] hover:text-white",
        ghost:       "text-white/45 hover:text-white/80 hover:bg-white/[0.06]",
        outline:     "border border-white/[0.12] text-white/55 hover:border-white/[0.22] hover:text-white",
        destructive: "border border-red-500/25 text-red-400 bg-red-500/[0.07] hover:bg-red-500/[0.12]",
        success:     "border border-emerald-500/25 text-emerald-400 bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-7 px-3 text-[12px]",
        lg:      "h-11 px-6 text-[14px]",
        icon:    "h-8 w-8",
        xs:      "h-6 px-2 text-[11px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
