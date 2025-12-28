import { motion } from 'framer-motion';
import { Announcement } from '@/types/tools';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  delay?: number;
}

export function AnnouncementCard({ announcement, onClick, delay = 0 }: AnnouncementCardProps) {
  const placeholderImage = 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?auto=format&fit=crop&q=80&w=1160';
  const date = new Date(announcement.publishedAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -2 }}
      className="flex bg-card rounded-lg overflow-hidden transition hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      {/* Vertical Date */}
      <div className="rotate-180 p-2 [writing-mode:vertical-lr]">
        <time 
          dateTime={announcement.publishedAt} 
          className="flex items-center justify-between gap-4 text-xs font-bold text-foreground uppercase"
        >
          <span>{format(date, 'yyyy')}</span>
          <span className="w-px flex-1 bg-border"></span>
          <span>{format(date, 'dd MMM', { locale: ptBR })}</span>
        </time>
      </div>

      {/* Image */}
      <div className="hidden sm:block sm:basis-56">
        <img
          alt={announcement.title}
          src={announcement.imageUrl || placeholderImage}
          className="aspect-square h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="border-s border-border p-4 sm:border-l-transparent sm:p-6">
          <h3 className="font-bold text-foreground uppercase line-clamp-2">
            {announcement.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {announcement.summary}
          </p>
        </div>

        <div className="sm:flex sm:items-end sm:justify-end">
          <span className="block bg-primary px-5 py-3 text-center text-xs font-bold text-primary-foreground uppercase transition hover:bg-primary/90">
            Ler mais
          </span>
        </div>
      </div>
    </motion.article>
  );
}