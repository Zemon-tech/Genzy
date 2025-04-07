// Service Worker Registration
// This file handles the registration of the service worker for PWA functionality

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    // Prevent immediate offline checks by waiting a bit
    const initialOfflineCheck = navigator.onLine;
    
    // Store our online status to prevent false offline messages
    if (initialOfflineCheck) {
      sessionStorage.setItem('wasOffline', 'false');
      localStorage.setItem('offlineMode', 'false');
    }
    
    // Wait for the page to load
    window.addEventListener('load', () => {
      // Delay service worker registration slightly to prioritize page load
      setTimeout(() => {
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
      }, 1000); // Small delay to prioritize page rendering
          
      // Additional handler for controlling page refreshes
      // This helps prevent the offline message when refreshing
      console.log('Browser reports initial online status:', navigator.onLine);
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('Application is online');
        // If we were offline and now we're online, update status but don't reload
        sessionStorage.setItem('wasOffline', 'false');
        localStorage.setItem('offlineMode', 'false');
      });
      
      window.addEventListener('offline', () => {
        console.log('Application is offline');
        sessionStorage.setItem('wasOffline', 'true');
        localStorage.setItem('offlineMode', 'true');
      });
    });
  } else {
    console.log('Service workers are not supported in this browser.');
  }
};

// Add a function to check if we should skip the offline page
export const shouldSkipOfflinePage = () => {
  // First page load - never show offline on first load
  if (!sessionStorage.getItem('pageLoaded')) {
    sessionStorage.setItem('pageLoaded', 'true');
    return true;
  }
  
  // User is online - skip offline page
  if (navigator.onLine) {
    return true;
  }
  
  // User previously confirmed offline - may show offline page
  return sessionStorage.getItem('wasOffline') !== 'true';
};

export default registerSW; 