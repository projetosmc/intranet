import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { 
  Star, 
  Megaphone, 
  Grid3X3, 
  Calendar,
  Activity,
  HeadphonesIcon,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useTools } from '@/hooks/useTools';
import { useDbAnnouncements } from '@/hooks/useDbAnnouncements';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Status indicator component for Status card
function StatusIndicator({ status, name }: { status: 'operational' | 'degraded' | 'down'; name: string }) {
  const config = {
    operational: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Operacional' },
    degraded: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Degradado' },
    down: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Fora do ar' },
  };
  
  const { icon: Icon, color, bg } = config[status];
  
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", bg)}>
      <Icon className={cn("h-4 w-4", color)} />
      <span className="text-sm font-medium text-foreground">{name}</span>
    </div>
  );
}

// Tool card for the marquee
function ToolCard({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/30">
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-medium text-foreground whitespace-nowrap">{name}</span>
    </div>
  );
}

// Notification item for announcements
function NotificationItem({ title, time }: { title: string; time: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
    >
      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </motion.div>
  );
}

const tools = [
  { name: "Despesas", icon: "💳" },
  { name: "Preços", icon: "🏷️" },
  { name: "Pré-fatura", icon: "📄" },
  { name: "Cliente", icon: "⛽" },
  { name: "Auditoria", icon: "🔍" },
];

const systems = [
  { name: "Portal Cliente", status: 'operational' as const },
  { name: "Portal Preços", status: 'operational' as const },
  { name: "Requisição", status: 'operational' as const },
];

export function HomeBentoGrid() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { getFavoriteTools } = useTools();
  const { activeAnnouncements } = useDbAnnouncements();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const favoriteTools = getFavoriteTools();
  const recentAnnouncements = activeAnnouncements.slice(0, 3);

  return (
    <div ref={containerRef} className="relative">
      <BentoGrid className="lg:grid-rows-2">
        {/* Ferramentas */}
        <BentoCard
          Icon={Grid3X3}
          name="Ferramentas"
          description="Acesse todas as ferramentas da Monte Carlo."
          cta="Ver catálogo"
          className="lg:col-span-1"
          onClick={() => navigate('/ferramentas')}
          background={
            <div className="absolute inset-x-4 bottom-16 flex flex-wrap gap-2">
              {tools.map((tool, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ToolCard {...tool} />
                </motion.div>
              ))}
            </div>
          }
        />

        {/* Comunicados */}
        <BentoCard
          Icon={Megaphone}
          name="Comunicados"
          description="Fique por dentro das novidades."
          cta="Ver todos"
          className="lg:col-span-2"
          onClick={() => navigate('/comunicados')}
          background={
            <div className="absolute inset-x-4 top-20 space-y-2">
              {recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((announcement, idx) => (
                  <NotificationItem
                    key={announcement.id}
                    title={announcement.title}
                    time={announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString('pt-BR') : 'Recente'}
                  />
                ))
              ) : (
                <>
                  <NotificationItem title="Novo sistema de despesas disponível" time="Há 2 horas" />
                  <NotificationItem title="Manutenção programada para sábado" time="Há 5 horas" />
                  <NotificationItem title="Atualização do portal de preços" time="Ontem" />
                </>
              )}
            </div>
          }
        />

        {/* Status dos Sistemas */}
        <BentoCard
          Icon={Activity}
          name="Status dos Sistemas"
          description="Monitore a disponibilidade dos serviços."
          cta="Ver detalhes"
          className="lg:col-span-1"
          onClick={() => navigate('/status')}
          background={
            <div className="absolute inset-x-4 top-20 space-y-2">
              {systems.map((system, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <StatusIndicator {...system} />
                </motion.div>
              ))}
            </div>
          }
        />

        {/* Suporte */}
        <BentoCard
          Icon={HeadphonesIcon}
          name="Suporte"
          description="Precisa de ajuda? Entre em contato."
          cta="Abrir chamado"
          className="lg:col-span-1"
          onClick={() => navigate('/suporte')}
          background={
            <div className="absolute inset-x-4 top-20 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tempo médio de resposta</p>
                  <p className="text-lg font-bold text-primary">~2 horas</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">Chat</Badge>
                <Badge variant="secondary" className="text-xs">Email</Badge>
                <Badge variant="secondary" className="text-xs">Telefone</Badge>
              </div>
            </div>
          }
        />

        {/* Calendário */}
        <BentoCard
          Icon={Calendar}
          name="Calendário"
          description="Eventos e datas importantes."
          cta="Ver agenda"
          className="lg:col-span-1"
          onClick={() => {}}
          background={
            <div className="absolute inset-x-4 top-16 flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-lg border border-border/50 bg-card/80 shadow-sm"
                />
              </div>
            </div>
          }
        />
      </BentoGrid>
      
      {/* Animated beams connecting cards */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
