import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AnimatedThemeTogglerProps {
  className?: string;
}

export function AnimatedThemeToggler({ className }: AnimatedThemeTogglerProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // View Transitions API (fallback se não suportado)
    if (!document.startViewTransition) {
      document.documentElement.classList.toggle("dark");
      setIsDark(!isDark);
      return;
    }

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle("dark");
      setIsDark(!isDark);
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 400,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        className
      )}
      aria-label="Alternar tema"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
