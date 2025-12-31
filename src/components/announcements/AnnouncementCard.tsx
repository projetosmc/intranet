import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Announcement } from '@/types/announcements';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  delay?: number;
}

export const AnnouncementCard = forwardRef<HTMLElement, AnnouncementCardProps>(
  function AnnouncementCard({ announcement, onClick, delay = 0 }, ref) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const placeholderImage = '/placeholder.svg';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Otimizar URL de imagem do Supabase ou Unsplash
  const getOptimizedImageUrl = (url: string | null): string => {
    if (!url) return placeholderImage;
    
    // Para Unsplash, adicionar parâmetros de otimização
    if (url.includes('unsplash.com')) {
      return `${url}&w=400&q=75&fm=webp`;
    }
    
    // Para Supabase Storage, usar transformações se disponível
    if (url.includes('supabase.co/storage')) {
      return url.includes('?') ? `${url}&width=400&quality=75` : `${url}?width=400&quality=75`;
    }
    
    return url;
  };

  const imageUrl = getOptimizedImageUrl(announcement.imageUrl);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-card border border-border"
      onClick={onClick}
    >
      <div className="h-40 overflow-hidden relative bg-muted">
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <img
          src={imageError ? placeholderImage : imageUrl}
          alt={announcement.title}
          className={`w-full h-full object-cover transition-all duration-300 hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
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
});