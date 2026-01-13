import { useState } from 'react';
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjetosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const externalUrl = 'https://projetos.redemontecarlo.com.br/';

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-xl font-semibold text-foreground">
          Não foi possível carregar a página
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          O site pode estar bloqueando o carregamento em iframe por motivos de segurança.
        </p>
        <Button asChild>
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-120px)] w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <iframe
        src={externalUrl}
        className="w-full h-full border-0 rounded-lg"
        title="Projetos Monte Carlo"
        onLoad={handleLoad}
        onError={handleError}
        allow="fullscreen"
      />
    </div>
  );
}
