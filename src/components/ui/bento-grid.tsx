import { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
  href?: string;
  cta?: string;
  onClick?: () => void;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  onClick,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-card border border-border/50",
        "h-[280px] p-6",
        "transform-gpu transition-all duration-300",
        "hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      {/* Background - contained and non-overlapping */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-300">
          {background}
        </div>
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
          </div>
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* CTA */}
        {cta && (
          <div className="mt-auto pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:text-primary hover:bg-primary/10 -ml-2"
              onClick={onClick}
              asChild={!!href}
            >
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {cta}
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              ) : (
                <>
                  {cta}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Hover gradient overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-primary/5 to-transparent" />
    </div>
  );
}
