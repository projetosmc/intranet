import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Announcement, ImagePosition } from '@/types/announcements';
import { useNavigate } from 'react-router-dom';

interface BannerCarouselProps {
  banners: Announcement[];
}

// Otimizar URL de imagem com prioridade alta
const getOptimizedBannerUrl = (url: string | null): string => {
  if (!url) return '/placeholder.svg';
  if (url.includes('unsplash.com')) {
    return `${url}&w=1200&q=75&fm=webp`;
  }
  if (url.includes('supabase.co/storage')) {
    return url.includes('?') ? `${url}&width=1200&quality=75` : `${url}?width=1200&quality=75`;
  }
  return url;
};

// Preload image utility
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
};

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Preload all banner images on mount for faster loading
  useEffect(() => {
    if (banners.length === 0) return;
    
    // Preload first image immediately with high priority
    const firstImageUrl = getOptimizedBannerUrl(banners[0].imageUrl);
    preloadImage(firstImageUrl);
    
    // Preload remaining images after a short delay
    const timer = setTimeout(() => {
      banners.slice(1).forEach(banner => {
        preloadImage(getOptimizedBannerUrl(banner.imageUrl));
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [banners]);

  // Auto-advance slides - increased to 8 seconds
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide, isHovered]);

  // Handle mouse move for parallax effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  }, []);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const bannerImageUrl = getOptimizedBannerUrl(currentBanner.imageUrl);

  const getObjectPosition = (position?: ImagePosition): string => {
    switch (position) {
      case 'top': return 'object-top';
      case 'bottom': return 'object-bottom';
      case 'left': return 'object-left';
      case 'right': return 'object-right';
      default: return 'object-center';
    }
  };

  // Parallax transform based on mouse position
  const parallaxX = isHovered ? mousePosition.x * 20 : 0;
  const parallaxY = isHovered ? mousePosition.y * 10 : 0;
  const scale = isHovered ? 1.05 : 1;

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-card border border-border shadow-lg mx-0 px-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Main Carousel Container */}
      <div className="relative w-full h-0 pb-[35%] md:pb-[25%] bg-muted">
        {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentBanner.id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: imageLoaded ? 1 : 0 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.5 }} 
            className="absolute inset-0 cursor-pointer overflow-hidden" 
            onClick={() => navigate(`/comunicados/${currentBanner.id}`)}
          >
            <motion.img 
              src={bannerImageUrl} 
              alt={currentBanner.title} 
              className={`absolute inset-0 w-full h-full object-cover ${getObjectPosition(currentBanner.imagePosition)}`}
              style={{
                transform: `translate(${parallaxX}px, ${parallaxY}px) scale(${scale})`,
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
              }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-0 mx-0" />
            
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
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 rounded-full h-10 w-10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110" 
              style={{ opacity: isHovered ? 1 : 0.6 }}
              onClick={e => { e.stopPropagation(); prevSlide(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 rounded-full h-10 w-10 transition-all hover:scale-110" 
              style={{ opacity: isHovered ? 1 : 0.6 }}
              onClick={e => { e.stopPropagation(); nextSlide(); }}
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
              onClick={() => { setImageLoaded(false); setCurrentIndex(index); }} 
              className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
}