export const calculateDiscount = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice) return 0;
  const discount = ((mrp - sellingPrice) / mrp) * 100;
  return Math.round(discount);
};

// Utility to scroll page to top - useful for page transitions
export const scrollToTop = (smooth = false) => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

// Component to scroll to top on route change
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    scrollToTop();
  }, [pathname]);
  
  return null;
}; 