import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: 'video' | 'square' | 'banner' | 'card';
  width?: number;
  height?: number;
}

const aspectRatioClasses = {
  video: 'aspect-video',
  square: 'aspect-square',
  banner: 'aspect-[21/9] md:aspect-[3/1]',
  card: 'h-40',
};

// Adicionar parâmetros de otimização à URL da imagem
function getOptimizedSrc(src: string, width?: number): string {
  if (!src) return '';
  
  // Para imagens do Unsplash, adicionar parâmetros de WebP
  if (src.includes('unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('fm', 'webp');
    url.searchParams.set('q', '80');
    if (width) {
      url.searchParams.set('w', width.toString());
    }
    return url.toString();
  }
  
  // Para Supabase Storage, adicionar transformação se suportado
  if (src.includes('supabase') && src.includes('storage')) {
    // Supabase Storage suporta transformações via query params
    const url = new URL(src);
    if (width) {
      url.searchParams.set('width', width.toString());
    }
    url.searchParams.set('format', 'webp');
    return url.toString();
  }
  
  return src;
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  aspectRatio = 'card',
  width,
  height,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Otimizar URL da imagem para WebP quando possível
  const optimizedSrc = useMemo(() => getOptimizedSrc(src, width), [src, width]);

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
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Reset states quando src muda
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatioClasses[aspectRatio],
        className
      )}
      style={width && height ? { width, height } : undefined}
    >
      {/* Skeleton/Placeholder com gradiente animado */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isLoaded || hasError ? 'opacity-0' : 'opacity-100'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
      </div>

      {/* Imagem com suporte a WebP e fallback */}
      {isInView && !hasError && (
        <picture>
          {/* WebP source para navegadores modernos */}
          <source srcSet={optimizedSrc} type="image/webp" />
          {/* Fallback para navegadores antigos */}
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-500',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </picture>
      )}

      {/* Fallback para erro */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-muted-foreground text-sm text-center p-4">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Imagem indisponível
          </div>
        </div>
      )}
    </div>
  );
}
