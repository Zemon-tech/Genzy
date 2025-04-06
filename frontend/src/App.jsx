import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
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

function App() {
  // Check if the current path is a seller route
  const isSellerRoute = window.location.pathname.startsWith('/seller');
  console.log('Current path:', window.location.pathname, 'Is seller route:', isSellerRoute);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SellerAuthProvider>
            <Toaster />
            <ScrollToTopOnMount />
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
    </Router>
  );
}

export default App;
