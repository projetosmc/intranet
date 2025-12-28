"use client";

import { cn } from "@/lib/utils";
import { Bell, Megaphone, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AnimatedList } from "@/components/ui/animated-list";

interface NotificationItem {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

const notifications = [
  {
    name: "Novo Comunicado",
    description: "Política de Despesas 2025",
    time: "Agora",
    icon: "📢",
    color: "#00C9A7",
  },
  {
    name: "Ferramenta Atualizada",
    description: "Portal Cliente v2.0",
    time: "5min atrás",
    icon: "🔧",
    color: "#FFB800",
  },
  {
    name: "Manutenção Programada",
    description: "Portal Preços - 22h",
    time: "15min atrás",
    icon: "⚠️",
    color: "#FF3D71",
  },
  {
    name: "Nova Enquete",
    description: "Qual ferramenta você mais usa?",
    time: "30min atrás",
    icon: "📊",
    color: "#1E86FF",
  },
  {
    name: "Bem-vindo!",
    description: "Conheça o MC Hub",
    time: "1h atrás",
    icon: "👋",
    color: "#00C9A7",
  },
];

const Notification = ({ name, description, icon, color, time }: NotificationItem) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        "bg-card/80 backdrop-blur-sm",
        "border border-border/50",
        "transform-gpu shadow-lg"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium text-foreground">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </figcaption>
          <p className="text-sm font-normal text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function AnimatedNotificationList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full flex-col p-6 overflow-hidden",
        className
      )}
    >
      <AnimatedList delay={2000}>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>
    </div>
  );
}
