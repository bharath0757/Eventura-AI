"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[#e8735a] text-white hover:bg-[#c95a42] focus-visible:ring-[#e8735a]/40 shadow-sm",
  secondary: "bg-[#1e2a4a] text-white hover:bg-[#2d3f6b] focus-visible:ring-[#1e2a4a]/40 shadow-sm",
  outline:
    "border border-[#1e2a4a]/20 text-[#1e2a4a] hover:bg-[#1e2a4a]/5 focus-visible:ring-[#1e2a4a]/20",
  ghost: "text-[#1e2a4a] hover:bg-[#1e2a4a]/5 focus-visible:ring-[#1e2a4a]/20",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-7 py-3.5 text-base rounded-xl gap-2.5",
};

/**
 * Reusable Button component following Eventura AI design tokens.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
