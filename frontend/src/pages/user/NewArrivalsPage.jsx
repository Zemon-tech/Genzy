import { useState, useEffect } from 'react';
import ProductCard from '../../components/product/ProductCard';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { scrollToTop } from '../../utils/helpers';
import supabase from '../../config/supabase';

const NewArrivalsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts
    scrollToTop();
    
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate date from 10 days ago
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const isoDate = tenDaysAgo.toISOString();
        
        console.log('Fetching new arrivals since:', isoDate);
        
        // Fetch products created in the last 10 days
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .gt('created_at', isoDate)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log(`Found ${data?.length || 0} new arrivals`);
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching new arrivals:', err);
        setError(`Failed to load new arrivals: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto p-4">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">New Arrivals</h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Showing the latest products from the past 10 days</p>
            </div>
            
            {Array.isArray(products) && products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No new products in the last 10 days</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2 bg-black text-white rounded-full"
                >
                  Back to Home
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewArrivalsPage; 