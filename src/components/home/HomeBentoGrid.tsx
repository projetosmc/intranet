import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Megaphone, 
  Grid3X3, 
  Calendar,
  BarChart3,
  Wrench
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { AnimatedNotificationList } from "@/components/home/AnimatedNotificationList";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useTools } from '@/hooks/useTools';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { useState } from 'react';

const toolCards = [
  {
    name: "Requisição de Despesas",
    description: "Solicite reembolsos e despesas corporativas",
    icon: "💳",
  },
  {
    name: "Portal Cliente",
    description: "Gestão de abastecimentos e clientes",
    icon: "⛽",
  },
  {
    name: "Portal Preços",
    description: "Defina regras de precificação",
    icon: "🏷️",
  },
  {
    name: "Pré-fatura",
    description: "Visualize e confirme faturas",
    icon: "📄",
  },
  {
    name: "Auditoria",
    description: "Verifique preço x bomba",
    icon: "🔍",
  },
];

function ToolMarqueeCard({ name, description, icon }: { name: string; description: string; icon: string }) {
  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl p-4",
        "bg-card/60 backdrop-blur-sm border border-border/50",
        "hover:bg-card/80 transition-colors"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
          {icon}
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-foreground">
            {name}
          </figcaption>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        </div>
      </div>
    </figure>
  );
}

export function HomeBentoGrid() {
  const navigate = useNavigate();
  const { getFavoriteTools } = useTools();
  const { activeAnnouncements } = useDbAnnouncements();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const favoriteTools = getFavoriteTools();
  const pinnedAnnouncements = activeAnnouncements.filter(a => a.pinned);

  const features = [
    {
      Icon: Grid3X3,
      name: "Ferramentas",
      description: "Acesse todas as ferramentas da Monte Carlo em um só lugar.",
      cta: "Ver catálogo",
      className: "col-span-3 lg:col-span-1",
      onClick: () => navigate('/ferramentas'),
      background: (
        <div className="absolute right-0 top-0 h-full w-full opacity-60">
          <Marquee
            pauseOnHover
            className="absolute top-10 [--duration:20s]"
          >
            {toolCards.map((tool, idx) => (
              <ToolMarqueeCard key={idx} {...tool} />
            ))}
          </Marquee>
        </div>
      ),
    },
    {
      Icon: Megaphone,
      name: "Comunicados",
      description: "Fique por dentro das novidades e atualizações.",
      cta: "Ver todos",
      className: "col-span-3 lg:col-span-2",
      onClick: () => navigate('/comunicados'),
      background: (
        <AnimatedNotificationList className="absolute right-2 top-4 h-[300px] w-full border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
      ),
    },
    {
      Icon: Star,
      name: "Favoritos",
      description: favoriteTools.length > 0 
        ? `${favoriteTools.length} ferramenta${favoriteTools.length > 1 ? 's' : ''} salva${favoriteTools.length > 1 ? 's' : ''}`
        : "Salve suas ferramentas mais usadas para acesso rápido.",
      cta: favoriteTools.length > 0 ? "Ver favoritos" : "Adicionar favoritos",
      className: "col-span-3 lg:col-span-2",
      onClick: () => navigate('/ferramentas'),
      background: (
        <div className="absolute right-0 top-0 h-full w-full opacity-40">
          <Marquee
            reverse
            pauseOnHover
            className="absolute top-10 [--duration:25s]"
          >
            {(favoriteTools.length > 0 ? favoriteTools : toolCards).slice(0, 5).map((tool: any, idx: number) => (
              <ToolMarqueeCard 
                key={idx} 
                name={tool.name}
                description={tool.description}
                icon={tool.icon || "⭐"}
              />
            ))}
          </Marquee>
        </div>
      ),
    },
    {
      Icon: Calendar,
      name: "Calendário",
      description: "Visualize eventos e datas importantes.",
      className: "col-span-3 lg:col-span-1",
      cta: "Ver agenda",
      onClick: () => {},
      background: (
        <div className="absolute right-0 top-10 origin-top rounded-md border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </div>
      ),
    },
  ];

  return (
    <BentoGrid className="lg:grid-rows-2">
      {features.map((feature, idx) => (
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  );
}
