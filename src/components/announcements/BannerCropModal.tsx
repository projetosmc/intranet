import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Crop, Maximize, ImageIcon } from 'lucide-react';
import { LoadingIcon } from '@/components/layout/GlobalLoadingIndicator';
import { cn } from '@/lib/utils';

interface BannerCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onSkipCrop?: () => void;
  aspectRatio?: number;
}

type FitMode = 'crop' | 'fit';
type BackgroundFill = 'blur' | 'color' | 'transparent';

// Banner aspect ratio: 16:5 (1920x600)
const BANNER_ASPECT_RATIO = 16 / 5;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 600;

// Função para criar imagem a partir de URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Função para recortar a imagem (modo crop)
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  outputWidth = OUTPUT_WIDTH,
  outputHeight = OUTPUT_HEIGHT
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const rotRad = (rotation * Math.PI) / 180;

  const { width: bBoxWidth, height: bBoxHeight } = {
    width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
    height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
  };

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context');
  }

  croppedCanvas.width = outputWidth;
  croppedCanvas.height = outputHeight;

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

// Função para ajustar a imagem inteira (modo fit)
async function getFittedImg(
  imageSrc: string,
  backgroundFill: BackgroundFill,
  backgroundColor: string = '#000000',
  outputWidth = OUTPUT_WIDTH,
  outputHeight = OUTPUT_HEIGHT
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Calcular dimensões para manter aspect ratio
  const imageAspect = image.width / image.height;
  const canvasAspect = outputWidth / outputHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imageAspect > canvasAspect) {
    // Imagem mais larga que o canvas
    drawWidth = outputWidth;
    drawHeight = outputWidth / imageAspect;
    drawX = 0;
    drawY = (outputHeight - drawHeight) / 2;
  } else {
    // Imagem mais alta que o canvas
    drawHeight = outputHeight;
    drawWidth = outputHeight * imageAspect;
    drawX = (outputWidth - drawWidth) / 2;
    drawY = 0;
  }

  // Aplicar preenchimento de fundo
  if (backgroundFill === 'blur') {
    // Desenhar imagem borrada no fundo (esticada)
    ctx.filter = 'blur(30px) brightness(0.7)';
    ctx.drawImage(image, -20, -20, outputWidth + 40, outputHeight + 40);
    ctx.filter = 'none';
  } else if (backgroundFill === 'color') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }
  // 'transparent' não precisa de preenchimento

  // Desenhar imagem principal centralizada
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const format = backgroundFill === 'transparent' ? 'image/png' : 'image/jpeg';
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      format,
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
  
  // Novos estados para modo de ajuste
  const [fitMode, setFitMode] = useState<FitMode>('crop');
  const [backgroundFill, setBackgroundFill] = useState<BackgroundFill>('blur');
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');

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
    setIsProcessing(true);
    try {
      let result: Blob;
      
      if (fitMode === 'crop') {
        if (!croppedAreaPixels) return;
        result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      } else {
        result = await getFittedImg(imageSrc, backgroundFill, backgroundColor);
      }
      
      onCropComplete(result);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFitMode('crop');
    setBackgroundFill('blur');
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
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
            Escolha como deseja ajustar a imagem para o formato do banner (16:5).
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFitMode('crop')}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
              fitMode === 'crop'
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <Crop className={cn("h-5 w-5", fitMode === 'crop' ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-medium text-sm">Recortar</p>
              <p className="text-xs text-muted-foreground">Selecione parte da imagem</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFitMode('fit')}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
              fitMode === 'fit'
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <Maximize className={cn("h-5 w-5", fitMode === 'fit' ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="font-medium text-sm">Ajustar</p>
              <p className="text-xs text-muted-foreground">Encaixar imagem inteira</p>
            </div>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {fitMode === 'crop' ? (
            <motion.div
              key="crop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden">
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
              </div>

              {/* Controles de Crop */}
              <div className="space-y-3">
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
                <div className="flex justify-center">
                  <Button type="button" variant="outline" size="sm" onClick={handleRotate} className="gap-2">
                    <RotateCw className="h-4 w-4" />
                    Girar 90°
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="fit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Preview da imagem ajustada */}
              <div 
                className="relative w-full rounded-lg overflow-hidden border border-border"
                style={{ aspectRatio: '16/5' }}
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: backgroundFill === 'color' ? backgroundColor : 'transparent',
                  }}
                >
                  {backgroundFill === 'blur' && (
                    <img
                      src={imageSrc}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-xl brightness-75 scale-110"
                    />
                  )}
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="relative max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Opções de preenchimento */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Preenchimento do fundo:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBackgroundFill('blur')}
                    className={cn(
                      "p-2 rounded-lg border text-xs transition-all",
                      backgroundFill === 'blur'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <ImageIcon className="h-4 w-4 mx-auto mb-1" />
                    Desfocado
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundFill('color')}
                    className={cn(
                      "p-2 rounded-lg border text-xs transition-all",
                      backgroundFill === 'color'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div 
                      className="h-4 w-4 mx-auto mb-1 rounded border"
                      style={{ backgroundColor: backgroundColor }}
                    />
                    Cor sólida
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundFill('transparent')}
                    className={cn(
                      "p-2 rounded-lg border text-xs transition-all",
                      backgroundFill === 'transparent'
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="h-4 w-4 mx-auto mb-1 rounded border bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%228%22%20height%3D%228%22%3E%3Crect%20fill%3D%22%23ccc%22%20width%3D%224%22%20height%3D%224%22%2F%3E%3Crect%20fill%3D%22%23ccc%22%20x%3D%224%22%20y%3D%224%22%20width%3D%224%22%20height%3D%224%22%2F%3E%3C%2Fsvg%3E')]" />
                    Transparente
                  </button>
                </div>
                
                {backgroundFill === 'color' && (
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-muted-foreground">Cor:</label>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs text-muted-foreground font-mono">{backgroundColor}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-16 h-5 border-2 border-dashed border-primary/50 rounded flex items-center justify-center text-[10px]">
            16:5
          </div>
          <span>Proporção do banner (1920x600)</span>
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
            disabled={isProcessing || (fitMode === 'crop' && !croppedAreaPixels)}
          >
            {isProcessing ? (
              <LoadingIcon size="sm" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
