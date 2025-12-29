/**
 * Hook para conversão e otimização de imagens para WebP
 */

import { useState, useCallback } from 'react';
import { compressImage, generateThumbnail } from './imageCompression';

interface WebPConversionResult {
  file: File;
  preview: string;
  thumbnail?: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
}

interface UseWebPConverterOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export function useWebPConverter(options: UseWebPConverterOptions = {}) {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const convertToWebP = useCallback(
    async (file: File): Promise<WebPConversionResult> => {
      setIsConverting(true);
      setProgress(0);

      try {
        const originalSize = file.size;
        setProgress(20);

        // Converter para WebP
        const compressedFile = await compressImage(file, {
          maxWidth: options.maxWidth ?? 1920,
          maxHeight: options.maxHeight ?? 1080,
          quality: options.quality ?? 0.85,
          format: 'webp',
        });
        setProgress(60);

        // Gerar preview
        const preview = URL.createObjectURL(compressedFile);
        setProgress(80);

        // Gerar thumbnail se solicitado
        let thumbnail: string | undefined;
        if (options.generateThumbnail) {
          thumbnail = await generateThumbnail(
            compressedFile,
            options.thumbnailSize ?? 200
          );
        }
        setProgress(100);

        const compressedSize = compressedFile.size;
        const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);

        return {
          file: compressedFile,
          preview,
          thumbnail,
          originalSize,
          compressedSize,
          savedPercent,
        };
      } finally {
        setIsConverting(false);
      }
    },
    [options]
  );

  const convertMultipleToWebP = useCallback(
    async (files: File[]): Promise<WebPConversionResult[]> => {
      setIsConverting(true);
      setProgress(0);

      try {
        const results: WebPConversionResult[] = [];
        const total = files.length;

        for (let i = 0; i < files.length; i++) {
          const result = await convertToWebP(files[i]);
          results.push(result);
          setProgress(Math.round(((i + 1) / total) * 100));
        }

        return results;
      } finally {
        setIsConverting(false);
      }
    },
    [convertToWebP]
  );

  return {
    convertToWebP,
    convertMultipleToWebP,
    isConverting,
    progress,
  };
}

/**
 * Converte uma URL de imagem para WebP (client-side)
 */
export async function convertUrlToWebP(
  imageUrl: string,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha ao converter para WebP'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = imageUrl;
  });
}

/**
 * Verifica se o navegador suporta WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}
