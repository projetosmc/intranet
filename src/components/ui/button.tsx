import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-[hsl(195_85%_38%)] text-primary-foreground hover:from-[hsl(195_100%_40%)] hover:to-[hsl(195_85%_34%)] shadow-sm hover:shadow-md",
        destructive: "bg-gradient-to-r from-destructive to-[hsl(0_84%_50%)] text-destructive-foreground hover:from-[hsl(0_84%_55%)] hover:to-[hsl(0_84%_45%)] shadow-sm hover:shadow-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-gradient-to-r from-secondary to-[hsl(215_20%_92%)] text-secondary-foreground hover:from-[hsl(215_20%_93%)] hover:to-[hsl(215_20%_88%)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-gradient-to-r from-success to-[hsl(142_70%_32%)] text-success-foreground hover:from-[hsl(142_76%_42%)] hover:to-[hsl(142_70%_30%)] shadow-sm hover:shadow-md",
        warning: "bg-gradient-to-r from-warning to-[hsl(35_96%_50%)] text-warning-foreground hover:from-[hsl(43_96%_58%)] hover:to-[hsl(35_96%_48%)] shadow-sm hover:shadow-md",
        info: "bg-gradient-to-r from-info to-[hsl(217_91%_50%)] text-info-foreground hover:from-[hsl(217_91%_62%)] hover:to-[hsl(217_91%_48%)] shadow-sm hover:shadow-md",
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-glow animate-glow-pulse hover:-translate-y-0.5",
        glass: "bg-card/50 backdrop-blur-md border border-border/50 text-foreground hover:bg-card/70 hover:-translate-y-0.5",
        sidebar: "bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground justify-start",
        "sidebar-active": "bg-sidebar-accent text-sidebar-primary justify-start font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };