import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Announcement } from '@/types/announcements';
import { PixelImage } from '@/components/ui/pixel-image';
import { useNavigate } from 'react-router-dom';

interface BannerCarouselProps {
  banners: Announcement[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-card border border-border shadow-lg">
      {/* Main Carousel Container */}
      <div className="relative aspect-[21/9] md:aspect-[3/1]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => navigate(`/comunicados/${currentBanner.id}`)}
          >
            <PixelImage
              src={currentBanner.imageUrl || ''}
              alt={currentBanner.title}
              customGrid={{ rows: 2, cols: 6 }}
              grayscaleAnimation={false}
              pixelFadeInDuration={500}
              maxAnimationDelay={600}
              className="absolute inset-0 w-full h-full"
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
