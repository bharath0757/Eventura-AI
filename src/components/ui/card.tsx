import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover lift effect */
  hoverable?: boolean;
}

/**
 * Reusable Card container following Eventura AI design tokens.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-white border border-[#1e2a4a]/8 p-6",
          "shadow-[0_1px_3px_rgba(30,42,74,0.04)]",
          hoverable && "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
