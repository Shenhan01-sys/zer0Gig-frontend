"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ShimmerButton({ children, className, disabled, ...props }: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        "relative w-full overflow-hidden rounded-xl px-6 py-3",
        "bg-white text-black text-[14px] font-semibold",
        "transition-all hover:bg-white/93 active:scale-[0.99]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {!disabled && (
        <motion.span
          className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "250%" }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "linear", repeatDelay: 1.5 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
