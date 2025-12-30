import { cn } from "@/lib/utils";

interface MCTechBadgeProps {
  className?: string;
  fixed?: boolean;
}

export function MCTechBadge({ className, fixed = false }: MCTechBadgeProps) {
  return (
    <a
      href="https://mctech.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-md",
        "bg-background/80 backdrop-blur-sm",
        "border border-border/30 shadow-sm",
        "opacity-60 hover:opacity-100 transition-opacity",
        fixed && "fixed bottom-3 right-3 z-10",
        className
      )}
    >
      {/* Logo placeholder - substitua por <img src={logoMcTech} alt="MC Tech" className="h-6" /> quando tiver o logo */}
      <div className="h-6 w-6 rounded bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-primary-foreground">MC</span>
      </div>
      <span className="text-[10px] text-muted-foreground hidden sm:inline">
        Desenvolvido por <span className="font-bold text-foreground">MC | Tech</span>
      </span>
    </a>
  );
}
