/**
 * PWA Helper Utilities
 * This file contains utility functions to help with PWA installation and diagnostics
 */

// Check if the app meets the criteria for installation
export const checkInstallationEligibility = () => {
  const diagnostics = {
    isHttps: window.location.protocol === 'https:',
    hasManifest: false,
    hasServiceWorker: false,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    result: false
  };

  // Check for manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  diagnostics.hasManifest = !!manifestLink;

  // Check for service worker
  diagnostics.hasServiceWorker = 'serviceWorker' in navigator;

  // Log the diagnostics to help debug installation issues
  console.log('PWA Installation Diagnostics:', diagnostics);

  // Check main requirements
  diagnostics.result = diagnostics.isHttps && 
                      diagnostics.hasManifest && 
                      diagnostics.hasServiceWorker &&
                      !diagnostics.isStandalone;

  return diagnostics;
};

// Function to manually check if the PWA is installable
export const isPwaInstallable = async () => {
  // Force return true for testing on production
  // Remove in production
  return true;

  // This is a more reliable approach but requires user interaction first
  try {
    // Try to detect if the browser supports installation
    let installPromptFired = false;
    
    const handleBeforeInstallPrompt = () => {
      installPromptFired = true;
      // Clean up immediately to avoid side effects
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Wait for a short time to see if the event fires
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return installPromptFired;
  } catch (error) {
    console.error('Error checking PWA installability:', error);
    return false;
  }
};

// Function to display manual installation instructions
export const showManualInstallInstructions = () => {
  // Detect browser and show appropriate instructions
  const ua = navigator.userAgent;
  let browser = 'unknown';
  let instructions = '';
  
  if (/chrome/i.test(ua)) {
    browser = 'Chrome';
    instructions = 'Tap the menu button (⋮) and select "Install App" or "Add to Home Screen"';
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
    instructions = 'Tap the menu button (⋮) and select "Install App" or "Add to Home Screen"';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
    instructions = 'Tap the share button (□↑) and select "Add to Home Screen"';
  } else if (/edge/i.test(ua)) {
    browser = 'Edge';
    instructions = 'Tap the menu button (...) and select "Add to Home Screen"';
  }
  
  return {
    browser,
    instructions,
    message: `To install this app on ${browser}, ${instructions}`
  };
};

export default {
  checkInstallationEligibility,
  isPwaInstallable,
  showManualInstallInstructions
}; 