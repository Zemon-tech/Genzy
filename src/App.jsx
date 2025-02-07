import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/user/BottomNav';
import Home from './pages/user/Home';
import Search from './pages/user/Search';
import Cart from './pages/user/Cart';
import Profile from './pages/user/Profile';

function App() {
  return (
    <Router>
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
