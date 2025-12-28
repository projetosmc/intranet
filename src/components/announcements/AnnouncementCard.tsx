import { motion } from 'framer-motion';
import { Announcement } from '@/types/announcements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  delay?: number;
}

export function AnnouncementCard({ announcement, onClick, delay = 0 }: AnnouncementCardProps) {
  const placeholderImage = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1160';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-card border border-border"
      onClick={onClick}
    >
      <img
        alt={announcement.title}
        src={announcement.imageUrl || placeholderImage}
        className="h-40 w-full object-cover"
      />

      <div className="p-4">
        <time 
          dateTime={announcement.publishedAt} 
          className="block text-xs text-muted-foreground"
        >
          {format(new Date(announcement.publishedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </time>

        <h3 className="mt-1 text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
          {announcement.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {announcement.summary}
        </p>
      </div>
    </motion.article>
  );
}