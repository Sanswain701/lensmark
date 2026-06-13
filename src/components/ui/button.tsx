import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-[0.01em] cursor-pointer transition-[colors,box-shadow,transform] duration-300 ease-[var(--ease-luxury)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:bg-primary/92 hover:shadow-[var(--shadow-elegant)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] hover:bg-destructive/90",
        outline:
          "border border-foreground/15 bg-background/40 backdrop-blur-sm hover:bg-foreground/[0.04] hover:border-foreground/25",
        secondary: "bg-secondary text-secondary-foreground shadow-[var(--shadow-soft)] hover:bg-secondary/80",
        ghost: "hover:bg-foreground/[0.04]",
        link: "text-primary underline-offset-4 hover:underline decoration-[var(--gold)]/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
