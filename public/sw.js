// Service Worker para cache de imagens com suporte offline
const CACHE_NAME = 'mc-images-v2';
const STATIC_CACHE = 'mc-static-v1';
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias
const MAX_CACHE_ITEMS = 100;

// URLs de imagens para cache
const isImageRequest = (url) => {
  return (
    url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
    url.includes('unsplash.com') ||
    (url.includes('supabase') && url.includes('storage'))
  );
};

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/placeholder.svg',
  '/favicon.ico',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições - Stale While Revalidate para imagens
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
      
      // Buscar da rede em background (Stale While Revalidate)
      const networkPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          // Clonar e cachear
          const responseToCache = networkResponse.clone();
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cached-date', Date.now().toString());
          
          responseToCache.blob().then((blob) => {
            const newResponse = new Response(blob, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers,
            });
            cache.put(request, newResponse);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.log('[SW] Rede indisponível:', url);
        return cachedResponse || Promise.reject(error);
      });
      
      // Se tiver cache válido, retornar imediatamente
      if (cachedResponse) {
        const cachedDate = cachedResponse.headers.get('sw-cached-date');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate, 10);
          if (age < IMAGE_CACHE_MAX_AGE) {
            // Atualizar em background, mas retornar cache
            return cachedResponse;
          }
        } else {
          return cachedResponse;
        }
      }

      // Se não tem cache, esperar pela rede
      return networkPromise;
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, urls } = event.data || {};
  
  switch (type || event.data) {
    case 'CLEAR_OLD_CACHE':
      cleanOldCache();
      break;
    case 'PREFETCH_IMAGES':
      prefetchImages(urls);
      break;
    case 'CACHE_IMAGE':
      if (urls) {
        prefetchImages(Array.isArray(urls) ? urls : [urls]);
      }
      break;
  }
});

// Limpar cache de imagens antigas
async function cleanOldCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  const entries = await Promise.all(
    keys.map(async (request) => {
      const response = await cache.match(request);
      const cachedDate = response?.headers.get('sw-cached-date');
      return {
        request,
        date: cachedDate ? parseInt(cachedDate, 10) : 0,
      };
    })
  );
  
  // Ordenar por data (mais antigas primeiro)
  entries.sort((a, b) => a.date - b.date);
  
  // Remover expiradas e excedentes
  const now = Date.now();
  let removedCount = 0;
  
  for (const entry of entries) {
    const isExpired = entry.date && (now - entry.date > IMAGE_CACHE_MAX_AGE);
    const exceedsLimit = entries.length - removedCount > MAX_CACHE_ITEMS;
    
    if (isExpired || exceedsLimit) {
      await cache.delete(entry.request);
      removedCount++;
      console.log('[SW] Cache removido:', entry.request.url);
    }
  }
  
  console.log(`[SW] Limpeza concluída: ${removedCount} itens removidos`);
}

// Pré-carregar imagens
async function prefetchImages(urls) {
  if (!urls || !urls.length) return;
  
  const cache = await caches.open(CACHE_NAME);
  
  for (const url of urls) {
    if (!url) continue;
    
    try {
      // Verificar se já está no cache
      const cached = await cache.match(url);
      if (cached) {
        console.log('[SW] Imagem já em cache:', url);
        continue;
      }
      
      // Buscar e cachear
      const response = await fetch(url);
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set('sw-cached-date', Date.now().toString());
        
        const blob = await response.blob();
        const newResponse = new Response(blob, {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
        });
        
        await cache.put(url, newResponse);
        console.log('[SW] Imagem pré-carregada:', url);
      }
    } catch (error) {
      console.log('[SW] Erro ao pré-carregar:', url, error);
    }
  }
}
