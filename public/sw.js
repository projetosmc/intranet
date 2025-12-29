// Service Worker para cache de imagens
const CACHE_NAME = 'mc-images-v1';
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

// URLs de imagens para cache
const isImageRequest = (url) => {
  return (
    url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
    url.includes('unsplash.com') ||
    (url.includes('supabase') && url.includes('storage'))
  );
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// Ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições - Cache First para imagens
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Só cachear imagens
  if (!isImageRequest(url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Tentar buscar do cache primeiro
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não está no cache, buscar da rede
      try {
        const networkResponse = await fetch(request);
        
        // Só cachear respostas válidas
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.log('[SW] Erro ao buscar:', url);
        throw error;
      }
    })
  );
});

// Limpar cache quando solicitado
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    console.log('[SW] Cache limpo');
  }
});
