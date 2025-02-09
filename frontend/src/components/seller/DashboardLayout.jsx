import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if seller is authenticated
    const isAuth = localStorage.getItem('sellerAuth');
    if (!isAuth) {
      navigate('/seller/login');
    }
  }, [navigate]);

  // Return null while checking authentication
  if (!localStorage.getItem('sellerAuth')) {
    return null;
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