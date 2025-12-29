import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Announcement } from '@/types/announcements';
import { useNavigate } from 'react-router-dom';

interface BannerCarouselProps {
  banners: Announcement[];
}

// Otimizar URL de imagem
const getOptimizedBannerUrl = (url: string | null): string => {
  if (!url) return '/placeholder.svg';
  
  if (url.includes('unsplash.com')) {
    return `${url}&w=1200&q=80&fm=webp`;
  }
  
  if (url.includes('supabase.co/storage')) {
    return url.includes('?') ? `${url}&width=1200&quality=80` : `${url}?width=1200&quality=80`;
  }
  
  return url;
};

// Pré-carregar imagem usando service worker ou link preload
const preloadImage = (url: string) => {
  if (!url || url === '/placeholder.svg') return;
  
  // Usar service worker se disponível
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_IMAGE',
      urls: [url],
    });
  } else {
    // Fallback: pré-carregar com Image object
    const img = new Image();
    img.src = url;
  }
};

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [preloadedIndexes, setPreloadedIndexes] = useState<Set<number>>(new Set([0]));
  const navigate = useNavigate();

  // Memoizar URLs otimizadas de todos os banners
  const optimizedUrls = useMemo(() => 
    banners.map(b => getOptimizedBannerUrl(b.imageUrl)),
    [banners]
  );

  // Pré-carregar imagens adjacentes quando o índice mudar
  useEffect(() => {
    if (banners.length <= 1) return;

    const nextIndex = (currentIndex + 1) % banners.length;
    const prevIndex = (currentIndex - 1 + banners.length) % banners.length;
    
    // Pré-carregar próxima e anterior se ainda não foram
    [nextIndex, prevIndex].forEach(index => {
      if (!preloadedIndexes.has(index)) {
        preloadImage(optimizedUrls[index]);
        setPreloadedIndexes(prev => new Set([...prev, index]));
      }
    });
  }, [currentIndex, banners.length, optimizedUrls, preloadedIndexes]);

  // Pré-carregar todas as imagens na inicialização (em background)
  useEffect(() => {
    if (banners.length <= 1) return;

    // Agendar pré-carregamento após a primeira imagem carregar
    const timer = setTimeout(() => {
      const urlsToPreload = optimizedUrls.filter((_, i) => i !== 0);
      
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PREFETCH_IMAGES',
          urls: urlsToPreload,
        });
      } else {
        // Fallback: pré-carregar uma por vez com delay
        urlsToPreload.forEach((url, i) => {
          setTimeout(() => {
            const img = new Image();
            img.src = url;
          }, i * 500);
        });
      }
    }, 2000); // Aguardar 2s antes de pré-carregar as demais

    return () => clearTimeout(timer);
  }, [banners.length, optimizedUrls]);

  const nextSlide = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const bannerImageUrl = optimizedUrls[currentIndex];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-card border border-border shadow-lg">
      {/* Main Carousel Container */}
      <div className="relative aspect-[21/9] md:aspect-[3/1] bg-muted">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => navigate(`/comunicados/${currentBanner.id}`)}
          >
            <img
              src={bannerImageUrl}
              alt={currentBanner.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-3xl font-bold text-white mb-2"
              >
                {currentBanner.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl"
              >
                {currentBanner.summary}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {banners.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 rounded-full h-10 w-10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 rounded-full h-10 w-10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Bottom Indicators */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 bg-muted/50">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
