# Progressive Web App (PWA) Implementation for Genzy

This document outlines the Progressive Web App implementation for the Genzy e-commerce platform.

## Features Implemented

- **Installable**: Users can add the app to their home screen on mobile devices and desktops
- **Offline Support**: Basic static assets are cached for offline use
- **Fast Loading**: Optimized caching strategies for assets and API calls
- **Mobile-Friendly**: Already responsive design adapted for PWA

## Implementation Details

### PWA Components

1. **Service Worker**: Manages caching and offline capabilities
2. **Web App Manifest**: Defines app metadata for installation
3. **Icons**: App icons for different platforms and sizes
4. **Offline Fallback**: A fallback page when offline

### Files Added/Modified

- `vite.config.js`: Added VitePWA plugin configuration
- `public/manifest.webmanifest`: App metadata for installation
- `public/icons/`: App icons in various sizes
- `public/offline.html`: Offline fallback page
- `src/registerSW.js`: Service Worker registration
- `src/main.jsx`: Updated to register service worker
- `index.html`: Updated with PWA meta tags
- `scripts/generate-icons.js`: Icon generation utility

## Testing PWA Features

### Installability

1. Access the site in Chrome or Edge on desktop, or any mobile browser
2. You should see an "Install" option in the browser menu
3. On mobile, some browsers will show an "Add to Home Screen" banner

### Offline Support

1. Install the PWA or visit in a browser
2. Navigate through the site to cache some pages
3. Enable airplane mode or disconnect from the internet
4. Try to access previously visited pages (they should load)
5. Try to access new pages (should show the offline fallback page)

### Performance

Use Lighthouse to audit the PWA features:

1. Open Chrome DevTools
2. Go to the "Lighthouse" tab
3. Check "Progressive Web App" category
4. Run the audit

## Maintenance and Updates

For future maintenance:

1. **Icon Updates**: Replace placeholder icons with branded ones
2. **Cache Strategy**: Adjust caching strategies in `vite.config.js` as needed
3. **Offline Experience**: Enhance offline.html to match brand guidelines
4. **Push Notifications**: Consider adding push notifications in the future

## Troubleshooting

If PWA features aren't working:

- Ensure you're using HTTPS in production (required for service workers)
- Clear browser cache and reload
- Check browser support for PWA features
- Verify the service worker is registered in the Application tab of DevTools