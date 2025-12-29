"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

type GridType = "6x4" | "8x8" | "8x3" | "4x6" | "3x8";

interface PixelImageProps {
  src: string;
  alt?: string;
  className?: string;
  grid?: GridType;
  customGrid?: { rows: number; cols: number };
  grayscaleAnimation?: boolean;
  pixelFadeInDuration?: number;
  maxAnimationDelay?: number;
  colorRevealDelay?: number;
}

const gridConfigs: Record<GridType, { rows: number; cols: number }> = {
  "6x4": { rows: 4, cols: 6 },
  "8x8": { rows: 8, cols: 8 },
  "8x3": { rows: 3, cols: 8 },
  "4x6": { rows: 6, cols: 4 },
  "3x8": { rows: 8, cols: 3 },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function PixelImage({
  src,
  alt = "",
  className,
  grid = "8x8",
  customGrid,
  grayscaleAnimation = true,
  pixelFadeInDuration = 1000,
  maxAnimationDelay = 1200,
  colorRevealDelay = 1500,
}: PixelImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showColor, setShowColor] = useState(!grayscaleAnimation);
  const [isInView, setIsInView] = useState(false);

  const { rows, cols } = customGrid || gridConfigs[grid];
  const totalPieces = rows * cols;

  // Gerar delays aleatórios para cada peça
  const pieceDelays = useMemo(() => {
    const indices = Array.from({ length: totalPieces }, (_, i) => i);
    const shuffled = shuffleArray(indices);
    return shuffled.map((_, index) => 
      (index / totalPieces) * maxAnimationDelay
    );
  }, [totalPieces, maxAnimationDelay]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Timer para revelar cores
  useEffect(() => {
    if (!isLoaded || !grayscaleAnimation || showColor) return;

    const timer = setTimeout(() => {
      setShowColor(true);
    }, colorRevealDelay + maxAnimationDelay);

    return () => clearTimeout(timer);
  }, [isLoaded, grayscaleAnimation, showColor, colorRevealDelay, maxAnimationDelay]);

  // Handler para quando todas as imagens carregarem
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Preload da imagem
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = handleImageLoad;
    img.src = src;
  }, [src, isInView, handleImageLoad]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        className
      )}
      style={{ aspectRatio: `${cols}/${rows}` }}
    >
      {/* Grid de peças pixeladas */}
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: totalPieces }).map((_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const delay = pieceDelays[index];

          return (
            <div
              key={index}
              className="relative overflow-hidden"
              style={{
                opacity: isLoaded && isInView ? 1 : 0,
                transition: `opacity ${pixelFadeInDuration}ms ease-out`,
                transitionDelay: `${delay}ms`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: isInView ? `url(${src})` : undefined,
                  backgroundSize: `${cols * 100}% ${rows * 100}%`,
                  backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
                  filter: grayscaleAnimation && !showColor ? "grayscale(100%)" : "grayscale(0%)",
                  transition: `filter 800ms ease-out`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Skeleton enquanto carrega */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Alt text para acessibilidade */}
      <span className="sr-only">{alt}</span>
    </div>
  );
}
