import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-1 text-[13px] text-white shadow-sm",
        "placeholder:text-white/20 transition-colors",
        "focus-visible:outline-none focus-visible:border-white/[0.22] focus-visible:bg-white/[0.06]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
