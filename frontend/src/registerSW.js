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
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  } else {
    console.log('Service workers are not supported in this browser.');
  }
};

export default registerSW; 