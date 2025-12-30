import { cn } from "@/lib/utils";
import logoMcTech from "@/assets/logo-mc-tech.png";

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
        "fixed bottom-3 right-3 z-10",
        "flex items-center gap-2 px-2.5 py-1.5 rounded-md",
        "bg-background/80 backdrop-blur-sm",
        "border border-border/30 shadow-sm",
        "opacity-60 hover:opacity-100 transition-opacity",
        className
      )}
    >
      <img src={logoMcTech} alt="MC Tech" className="h-6" />
      <span className="text-[10px] text-muted-foreground hidden sm:inline">
        Desenvolvido por <span className="font-bold text-foreground">MC | Tech</span>
      </span>
    </a>
  );
}
