import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Crop } from 'lucide-react';
import { LoadingIcon } from '@/components/layout/GlobalLoadingIndicator';

interface BannerCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onSkipCrop?: () => void;
  aspectRatio?: number;
}

// Banner aspect ratio: 16:5 (1920x600)
const BANNER_ASPECT_RATIO = 16 / 5;

// Função para criar imagem a partir de URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Função para recortar a imagem
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  outputWidth = 1920,
  outputHeight = 600
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calcular bounding box da imagem rotacionada
  const { width: bBoxWidth, height: bBoxHeight } = {
    width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
    height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
  };

  // Definir canvas para o tamanho do bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Transladar canvas para o centro e rotacionar
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Desenhar imagem rotacionada
  ctx.drawImage(image, 0, 0);

  // Criar canvas para o crop
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context');
  }

  // Definir tamanho do canvas de crop para proporção do banner
  croppedCanvas.width = outputWidth;
  croppedCanvas.height = outputHeight;

  // Desenhar área recortada no canvas de crop
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  // Retornar como blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

export function BannerCropModal({ 
  open, 
  onOpenChange, 
  imageSrc, 
  onCropComplete,
  onSkipCrop,
  aspectRatio = BANNER_ASPECT_RATIO 
}: BannerCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixelsParam: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsParam);
    },
    []
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onOpenChange(false);
      
      // Reset state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" />
            Ajustar Imagem do Banner
          </DialogTitle>
          <DialogDescription>
            Ajuste o zoom e a posição da imagem para o formato ideal do banner (16:5).
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden"
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape="rect"
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            classes={{
              containerClassName: 'rounded-lg',
              cropAreaClassName: 'border-2 border-primary'
            }}
          />
        </motion.div>

        {/* Preview indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-16 h-5 border-2 border-dashed border-primary/50 rounded flex items-center justify-center text-[10px]">
            16:5
          </div>
          <span>Proporção do banner</span>
        </div>

        {/* Controles */}
        <div className="space-y-4">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([value]) => setZoom(value)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotação */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Girar 90°
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isProcessing}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          {onSkipCrop && (
            <Button
              type="button"
              variant="outline"
              onClick={onSkipCrop}
              disabled={isProcessing}
            >
              Pular ajuste
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <LoadingIcon size="sm" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Aplicar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
