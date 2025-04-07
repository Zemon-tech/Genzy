// Service Worker Registration
// This file handles the registration of the service worker for PWA functionality

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    // Wait for the page to load
    window.addEventListener('load', () => {
      // Register the service worker from the root of the app
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Add a custom reload handler for the service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'RELOAD_PAGE') {
              window.location.reload();
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
        
      // Additional handler for controlling page refreshes
      // This helps prevent the offline message when refreshing
      if (navigator.onLine) {
        console.log('Browser reports online status');
      } else {
        console.log('Browser reports offline status');
      }
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('Application is online');
        // If we were offline and now we're online, reload to get fresh content
        sessionStorage.setItem('wasOffline', 'false');
        
        // Only reload if we previously detected being offline
        if (sessionStorage.getItem('wasOffline') === 'true') {
          window.location.reload();
        }
      });
      
      window.addEventListener('offline', () => {
        console.log('Application is offline');
        sessionStorage.setItem('wasOffline', 'true');
      });
    });
  } else {
    console.log('Service workers are not supported in this browser.');
  }
};

export default registerSW; 