import { motion } from 'framer-motion';
import { Pin, Calendar, ArrowRight } from 'lucide-react';
import { Announcement } from '@/types/tools';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  delay?: number;
}

export function AnnouncementCard({ announcement, onClick, delay = 0 }: AnnouncementCardProps) {
  const hasImage = announcement.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -2 }}
      className={cn(
        "glass-card group relative overflow-hidden cursor-pointer hover-lift",
        announcement.pinned && "border-primary/30"
      )}
      onClick={onClick}
    >
      {announcement.pinned && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="default" className="gap-1 text-[10px]">
            <Pin className="h-3 w-3" />
            Fixado
          </Badge>
        </div>
      )}

      {hasImage ? (
        <div className="flex flex-col">
          {/* Image Section */}
          <div className="relative h-32 w-full overflow-hidden">
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          
          {/* Content Section */}
          <div className="p-4">
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
              {announcement.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {announcement.summary}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(announcement.publishedAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                {announcement.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {announcement.summary}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(announcement.publishedAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
