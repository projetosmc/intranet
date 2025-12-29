/**
 * Registro do Service Worker para cache de imagens
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        console.log('[App] Service Worker registrado:', registration.scope);

        // Verificar atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // A cada hora

        // Limpar cache antigo ao iniciar
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage('CLEAR_OLD_CACHE');
        }
      } catch (error) {
        console.error('[App] Erro ao registrar Service Worker:', error);
      }
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
