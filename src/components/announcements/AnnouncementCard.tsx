import { motion } from 'framer-motion';
import { Announcement } from '@/types/announcements';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  delay?: number;
}

export function AnnouncementCard({ announcement, onClick, delay = 0 }: AnnouncementCardProps) {
  const placeholderImage = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1160';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-card border border-border"
      onClick={onClick}
    >
      <div className="h-40 overflow-hidden">
        <img
          src={announcement.imageUrl || placeholderImage}
          alt={announcement.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <time 
          dateTime={announcement.publishedAt} 
          className="block text-xs text-muted-foreground"
        >
          {format(new Date(announcement.publishedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </time>

        <h3 className="mt-1 text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
          {announcement.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {announcement.summary}
        </p>

        {announcement.author && (
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {announcement.author.avatarUrl ? (
                <AvatarImage src={announcement.author.avatarUrl} alt={announcement.author.name} />
              ) : null}
              <AvatarFallback className="text-xs">
                {getInitials(announcement.author.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Publicado por <span className="font-medium text-foreground">{announcement.author.name}</span>
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
}