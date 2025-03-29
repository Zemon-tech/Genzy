import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSellerAuth } from '../../context/SellerAuthContext';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { seller, loading } = useSellerAuth();

  useEffect(() => {
    // Check if seller is authenticated
    if (!loading && !seller) {
      navigate('/seller/login');
    }
  }, [navigate, seller, loading]);

  // Return null while checking authentication or if not authenticated
  if (loading || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-medium text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-full bg-gray-100 flex overflow-hidden">
      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
          onClick={() => document.querySelector('.mobile-sidebar').classList.toggle('translate-x-0')}
        >
          ☰
        </button>
      </div>

      {/* Mobile sidebar */}
      <div className="mobile-sidebar fixed inset-y-0 left-0 transform -translate-x-full transition-transform duration-300 ease-in-out md:hidden z-10">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout; 