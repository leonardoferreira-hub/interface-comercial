// Registro do Service Worker para PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado:', registration.scope);

          // Atualização do SW
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  console.log('Nova versão disponível!');
                  // Pode mostrar um toast para o usuário atualizar
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('SW falhou:', error);
        });
    });
  }
}

// Solicitar permissão para notificações
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Registrar sync para background sync
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register('sync-data');
      console.log('Background sync registrado');
    } catch (error) {
      console.error('Background sync falhou:', error);
    }
  }
}

// Verificar se o app está em modo standalone (instalado)
export function isAppInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
