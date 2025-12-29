/**
 * Utilitário para compressão automática de imagens antes do upload
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'webp',
};

/**
 * Comprime uma imagem mantendo proporções e qualidade
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Se não é imagem, retornar original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Se já é pequena (< 100KB), não comprimir
  if (file.size < 100 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto canvas'));
      return;
    }

    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img;
      const maxW = opts.maxWidth!;
      const maxH = opts.maxHeight!;

      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Aplicar suavização de alta qualidade
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob
      const mimeType = `image/${opts.format}`;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }

          // Criar novo arquivo com nome original + extensão correta
          const extension = opts.format === 'jpeg' ? 'jpg' : opts.format;
          const originalName = file.name.replace(/\.[^.]+$/, '');
          const newFileName = `${originalName}.${extension}`;

          const compressedFile = new File([blob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          // Log de economia
          const savedPercent = Math.round((1 - blob.size / file.size) * 100);
          console.log(
            `[ImageCompression] ${file.name}: ${formatBytes(file.size)} → ${formatBytes(blob.size)} (-${savedPercent}%)`
          );

          resolve(compressedFile);
        },
        mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Formata bytes para leitura humana
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Gera thumbnail de uma imagem
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto canvas'));
      return;
    }

    img.onload = () => {
      // Calcular dimensões do thumbnail (quadrado, crop central)
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      canvas.width = size;
      canvas.height = size;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Crop central e redimensionar
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL('image/webp', 0.8));
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem'));
    };

    img.src = URL.createObjectURL(file);
  });
}
