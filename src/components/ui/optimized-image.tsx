import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: 'video' | 'square' | 'banner' | 'card';
}

const aspectRatioClasses = {
  video: 'aspect-video',
  square: 'aspect-square',
  banner: 'aspect-[21/9] md:aspect-[3/1]',
  card: 'h-40',
};

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  aspectRatio = 'card',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Preload 200px antes de entrar na viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Skeleton/Placeholder */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse transition-opacity duration-500',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Imagem real - só carrega quando em view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}
