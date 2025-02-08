import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/user/BottomNav';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import Cart from './pages/user/Cart';
import Profile from './pages/user/Profile';
import Login from './pages/user/Login';
import SellerLogin from './pages/seller/Login';
import Dashboard from './pages/seller/Dashboard';
import DashboardLayout from './components/seller/DashboardLayout';
<<<<<<< HEAD

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};
=======
import { AuthProvider } from './context/AuthContext';
import { SellerAuthProvider } from './context/SellerAuthContext';
import AddProduct from './pages/seller/AddProduct';
>>>>>>> main

function App() {
  // Check if the current path is a seller route
  const isSellerRoute = window.location.pathname.startsWith('/seller');

  return (
<<<<<<< HEAD
    <Router>
      <AuthProvider>
        {isSellerRoute ? (
          // Seller Routes with full-width layout
          <Routes>
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/seller/*" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } />
          </Routes>
        ) : (
          // User Routes with mobile layout
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-md mx-auto bg-white min-h-screen relative">
              <div className="px-4 pb-24">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } />
                  <Route path="/search" element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  } />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
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
      </AuthProvider>
    </Router>
=======
    <AuthProvider>
      <SellerAuthProvider>
        <Router>
          {isSellerRoute ? (
            // Seller Routes with full-width layout
            <Routes>
              <Route path="/seller/login" element={<SellerLogin />} />
              <Route path="/seller" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/seller/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="add-product" element={<AddProduct />} />
                <Route path="products" element={<div className="p-4">Products page coming soon...</div>} />
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
    </AuthProvider>
>>>>>>> main
  );
}

export default App;
