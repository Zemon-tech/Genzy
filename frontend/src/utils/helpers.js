export const calculateDiscount = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice) return 0;
  const discount = ((mrp - sellingPrice) / mrp) * 100;
  return Math.round(discount);
};

// Store scroll positions for each path
const scrollPositions = new Map();

// Utility to scroll page to top - useful for page transitions
export const scrollToTop = (smooth = false) => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

// Component to handle scroll behavior on route change
import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType(); // 'POP', 'PUSH', or 'REPLACE'
  
  // Save current scroll position before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      scrollPositions.set(pathname, window.scrollY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Save the position when component unmounts (navigation)
    return () => {
      scrollPositions.set(pathname, window.scrollY);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);
  
  // Handle scrolling behavior on route change - use useLayoutEffect to run synchronously
  // before browser repaints, making the scroll position restoration immediate
  useLayoutEffect(() => {
    // Handle immediate scroll restoration for 'POP' navigation
    if (navigationType === 'POP') {
      const savedPosition = scrollPositions.get(pathname);
      if (savedPosition !== undefined) {
        // Use synchronous scroll with auto behavior for instant position restoration
        // This has to happen before any animations or painting
        window.scrollTo(0, savedPosition);
      }
    } else {
      // For 'PUSH' or 'REPLACE', scroll to top
      scrollToTop();
    }
  }, [pathname, navigationType]);
  
  return null;
}; 