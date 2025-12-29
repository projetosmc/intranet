// Service Worker para cache de imagens
const CACHE_NAME = 'mc-images-v1';
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

// URLs de imagens para cache
const isImageRequest = (url) => {
  return (
    url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
    url.includes('unsplash.com') ||
    url.includes('supabase') && url.includes('storage')
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
        // Verificar idade do cache
        const cachedDate = cachedResponse.headers.get('sw-cached-date');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate, 10);
          if (age < IMAGE_CACHE_MAX_AGE) {
            console.log('[SW] Servindo do cache:', url);
            return cachedResponse;
          }
        } else {
          // Se não tem data, ainda usar o cache
          console.log('[SW] Servindo do cache (sem data):', url);
          return cachedResponse;
        }
      }

      // Se não está no cache ou expirou, buscar da rede
      try {
        console.log('[SW] Buscando da rede:', url);
        const networkResponse = await fetch(request);
        
        // Só cachear respostas válidas
        if (networkResponse.ok) {
          // Clonar resposta e adicionar header com data
          const responseToCache = networkResponse.clone();
          const headers = new Headers(responseToCache.headers);
          headers.append('sw-cached-date', Date.now().toString());
          
          const newResponse = new Response(await responseToCache.blob(), {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
          });
          
          cache.put(request, newResponse);
        }
        
        return networkResponse;
      } catch (error) {
        // Se falhar a rede e tiver cache antigo, usar mesmo assim
        if (cachedResponse) {
          console.log('[SW] Rede falhou, usando cache antigo:', url);
          return cachedResponse;
        }
        throw error;
      }
    })
  );
});

// Limpar cache de imagens muito antigas periodicamente
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_OLD_CACHE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach(async (request) => {
          const response = await cache.match(request);
          const cachedDate = response?.headers.get('sw-cached-date');
          if (cachedDate) {
            const age = Date.now() - parseInt(cachedDate, 10);
            if (age > IMAGE_CACHE_MAX_AGE) {
              cache.delete(request);
              console.log('[SW] Cache expirado removido:', request.url);
            }
          }
        });
      });
    });
  }
});
