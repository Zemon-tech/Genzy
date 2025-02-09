import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/user/BottomNav';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import Cart from './pages/user/Cart';
import Profile from './pages/user/Profile';
import Login from './pages/user/Login';
import SellerLogin from './pages/seller/Login';
import Dashboard from './pages/seller/Dashboard';
import AddProduct from './pages/seller/AddProduct';
import DashboardLayout from './components/seller/DashboardLayout';
import { AuthProvider } from './context/AuthContext';
import { SellerAuthProvider } from './context/SellerAuthContext';
import SellerProducts from './components/seller/SellerProducts';
import EditProduct from './pages/seller/EditProduct';
import { CartProvider } from './context/CartContext';
import ProductPage from './pages/user/ProductPage';
import { Toaster } from 'react-hot-toast';

function App() {
  // Check if the current path is a seller route
  const isSellerRoute = window.location.pathname.startsWith('/seller');

  return (
    <AuthProvider>
      <CartProvider>
        <SellerAuthProvider>
          <Router>
            <Toaster />
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
                  {/* Add other seller routes here */}
                </Route>
              </Routes>
            ) : (
              // User Routes with mobile layout
              <div className="min-h-screen bg-gray-50">
                <div className="max-w-md mx-auto bg-white min-h-screen relative">
                  <div className="px-4 pb-24">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/product/:productId" element={<ProductPage />} />
                    </Routes>
                  </div>
                  <div className="fixed bottom-0 left-0 right-0">
                    <div className="max-w-md mx-auto">
                      <BottomNav />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Router>
        </SellerAuthProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
