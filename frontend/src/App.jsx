import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BottomNav from './components/user/BottomNav';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import Cart from './pages/user/Cart';
import Profile from './pages/user/Profile';
import Login from './pages/user/Login';
import Wishlist from './pages/user/Wishlist';
import SellerLogin from './pages/seller/Login';
import Dashboard from './pages/seller/Dashboard';
import AddProduct from './pages/seller/AddProduct';
import DashboardLayout from './components/seller/DashboardLayout';
import { AuthProvider } from './context/AuthContext';
import { SellerAuthProvider } from './context/SellerAuthContext';
import SellerProducts from './components/seller/SellerProducts';
import EditProduct from './pages/seller/EditProduct';
import SizeChart from './pages/seller/SizeChart';
import { CartProvider } from './context/CartContext';
import ProductPage from './pages/user/ProductPage';
import { Toaster } from 'react-hot-toast';
import Address from './pages/user/Address';
import CategoryPage from './pages/user/CategoryPage';
import Checkout from './pages/user/Checkout';
import OrderSuccess from './pages/user/OrderSuccess';
import Orders from './pages/seller/Orders';
import MyOrders from './pages/user/MyOrders';
import CompletedOrders from './pages/seller/CompletedOrders';
import SalePage from './pages/user/SalePage';
import NewArrivalsPage from './pages/user/NewArrivalsPage';
import { ScrollToTopOnMount } from './utils/helpers';
import AboutPage from './pages/user/AboutPage';
import ContactPage from './pages/user/ContactPage';
import PrivacyPage from './pages/user/PrivacyPage';
import TermsPage from './pages/user/TermsPage';
import { AnimatePresence, motion } from 'framer-motion';
import { checkInstallationEligibility } from './utils/pwaHelpers';
import { shouldSkipOfflinePage } from './registerSW';
import SplashScreen from './components/SplashScreen';

// Animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  },
  // New variant for when we don't want animation
  none: {
    opacity: 1,
    y: 0
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.2 // Reduced from 0.3 for faster transitions
};

// AnimatedRoutes component to handle route animations
const AnimatedRoutes = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  
  // Disable animations completely for POP navigation (going back)
  const shouldAnimate = navigationType !== 'POP';

  // If we're going back, don't use animations at all
  if (!shouldAnimate) {
    return (
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/address" element={<Address />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/sale" element={<SalePage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>
    );
  }

  // Only use animations for forward navigation
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/address" element={<Address />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

// NetworkStatusProvider component to detect and manage network status at app level
function NetworkStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update local network status when it changes
    const handleOnlineStatus = () => {
      console.log('Network status change detected: online');
      setIsOnline(true);
      localStorage.setItem('offlineMode', 'false');
      // Clear service worker cache if needed for problematic pages
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_OFFLINE_STATUS'
        });
      }
    };
    
    const handleOfflineStatus = () => {
      console.log('Network status change detected: offline');
      setIsOnline(false);
      localStorage.setItem('offlineMode', 'true');
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // On app load, fetch a small resource to verify connectivity
    // This helps detect cases where browser thinks we're online but we're not
    if (navigator.onLine) {
      fetch('/', { method: 'HEAD', cache: 'no-store' })
        .then(() => {
          console.log('Connectivity verified with server');
          setIsOnline(true);
        })
        .catch(err => {
          console.log('Failed to connect to server despite online status', err);
          // Don't set offline here, defer to the browser's status
        });
    }
    
    // Set a flag to indicate the app has been loaded at least once
    sessionStorage.setItem('appLoaded', 'true');
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);
  
  // If device just reported going offline, use this context to update UI appropriately
  return children;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const isSellerRoute = window.location.pathname.startsWith('/seller');

  useEffect(() => {
    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // PWA diagnostics on application start
  useEffect(() => {
    // Check if PWA requirements are met and log diagnostics
    const pwaStatus = checkInstallationEligibility();
    console.log('PWA STATUS:', pwaStatus);
    
    // On fresh load, always clear any stale offline status
    if (!sessionStorage.getItem('refreshCount')) {
      sessionStorage.setItem('refreshCount', '1');
      sessionStorage.setItem('wasOffline', 'false');
      localStorage.setItem('offlineMode', 'false');
      
      // If we should skip offline page on load, notify the service worker
      if (shouldSkipOfflinePage() && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SKIP_OFFLINE_CHECK'
        });
      }
    } else {
      // Increment refresh count
      const count = parseInt(sessionStorage.getItem('refreshCount') || '0');
      sessionStorage.setItem('refreshCount', (count + 1).toString());
    }
    
    // Handle service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed - new content available');
      });
    }
  }, []);

  return (
    <Router>
      <NetworkStatusProvider>
        <AuthProvider>
          <CartProvider>
            <SellerAuthProvider>
              <Toaster />
              <ScrollToTopOnMount />
              <AnimatePresence mode="wait">
                {showSplash && <SplashScreen />}
              </AnimatePresence>
              {isSellerRoute ? (
                // Seller Routes with full-width layout
                <Routes>
                  <Route path="/seller/login" element={<SellerLogin />} />
                  <Route path="/seller" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/seller/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<SellerProducts />} />
                    <Route path="add-product" element={<AddProduct />} />
                    <Route path="edit-product/:productId" element={<EditProduct />} />
                    <Route path="size-chart" element={<SizeChart />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="completed-orders" element={<CompletedOrders />} />
                    {/* Add other seller routes here */}
                  </Route>
                </Routes>
              ) : (
                // User Routes with mobile layout
                <div className="min-h-screen bg-gray-50">
                  <div className="max-w-[480px] mx-auto bg-white min-h-screen relative">
                    <div className="pb-16">
                      <AnimatedRoutes />
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 z-10">
                      <div className="max-w-[480px] mx-auto">
                        <BottomNav />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SellerAuthProvider>
          </CartProvider>
        </AuthProvider>
      </NetworkStatusProvider>
    </Router>
  );
}

export default App;
