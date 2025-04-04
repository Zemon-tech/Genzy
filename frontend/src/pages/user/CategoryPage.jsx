import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { scrollToTop } from '../../utils/helpers';

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Format the category name for display (convert slug to title case)
  const formatCategoryName = (slug) => {
    // Check if the original category contained hyphens that should be preserved
    // We'll capitalize each segment independently
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');  // For display purposes, we always use spaces
  };

  const categoryName = formatCategoryName(categorySlug);

  useEffect(() => {
    // Scroll to top when component mounts or category changes
    scrollToTop();
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching products for category slug:', categorySlug);
        
        // Directly use supabase for data fetching instead of the API endpoint
        const supabase = (await import('../../config/supabase')).default;
        
        // Create variations of the category name to try
        const exactMatch = categorySlug.toLowerCase();  // e.g., "t-shirts"
        const noHyphen = categorySlug.toLowerCase().replace(/-/g, '');  // e.g., "tshirts"
        const withSpaces = categorySlug.toLowerCase().replace(/-/g, ' ');  // e.g., "t shirts"
        const titleCase = formatCategoryName(categorySlug);  // e.g., "T-shirts"
        
        console.log('Trying variations:', [exactMatch, noHyphen, withSpaces, titleCase]);
        
        // First try exact match with the URL slug
        let { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('category', exactMatch);
          
        // If no results, try with case-insensitive matching
        if (!fetchError && (!data || data.length === 0)) {
          const { data: ilikeData, error: ilikeError } = await supabase
            .from('products')
            .select('*')
            .ilike('category', `%${exactMatch}%`);
            
          if (!ilikeError && ilikeData && ilikeData.length > 0) {
            data = ilikeData;
          }
        }
        
        // If still no results, try with no hyphens 
        if (!fetchError && (!data || data.length === 0)) {
          const { data: noHyphenData, error: noHyphenError } = await supabase
            .from('products')
            .select('*')
            .ilike('category', `%${noHyphen}%`);
            
          if (!noHyphenError && noHyphenData && noHyphenData.length > 0) {
            data = noHyphenData;
          }
        }
        
        // If still no results, try with spaces instead of hyphens
        if (!fetchError && (!data || data.length === 0)) {
          const { data: withSpacesData, error: withSpacesError } = await supabase
            .from('products')
            .select('*')
            .ilike('category', `%${withSpaces}%`);
            
          if (!withSpacesError && withSpacesData && withSpacesData.length > 0) {
            data = withSpacesData;
          }
        }
        
        // Final attempt with title case
        if (!fetchError && (!data || data.length === 0)) {
          const { data: titleCaseData, error: titleCaseError } = await supabase
            .from('products')
            .select('*')
            .ilike('category', `%${titleCase}%`);
            
          if (!titleCaseError && titleCaseData && titleCaseData.length > 0) {
            data = titleCaseData;
          }
        }
        
        if (fetchError) throw fetchError;
        
        console.log(`Found ${data?.length || 0} products via supabase`);
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Failed to load products: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug]);

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
        <h1 className="text-2xl font-bold">{categoryName}</h1>
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
          {Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found in this category</p>
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
  );
};

export default CategoryPage; 