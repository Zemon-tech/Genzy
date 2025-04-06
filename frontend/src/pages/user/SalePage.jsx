import { HiOutlineChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const SalePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Sale 50%+ OFF</h1>
      </div>

      {/* Placeholder content for sale page */}
      <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-xl font-bold mb-2">Mega Sales Coming Soon!</h2>
        <p>We&apos;re preparing huge discounts on all your favorite styles.</p>
        <p className="mt-2 text-white/80">Check back soon for amazing deals!</p>
      </div>

      {/* Empty state */}
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-700 mb-2">No Sale Products Yet</p>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We&apos;re preparing a special selection of discounted products. Come back soon to grab amazing deals!
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-black text-white rounded-full"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default SalePage; 