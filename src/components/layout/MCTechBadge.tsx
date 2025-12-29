import { cn } from "@/lib/utils";

interface MCTechBadgeProps {
  className?: string;
}

export function MCTechBadge({ className }: MCTechBadgeProps) {
  return (
    <a
      href="https://mctech.com.br"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors",
        className
      )}
    >
      <div className="h-5 w-5 rounded bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary">MC</span>
      </div>
      <span>Desenvolvido por MC | Tech</span>
    </a>
  );
}
