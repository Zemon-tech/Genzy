import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../utils/constants';

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
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching products for category slug:', categorySlug);
        
        // Directly use supabase for data fetching instead of the API endpoint
        const supabase = (await import('../../config/supabase')).default;
        
        // Create variations of the category name to try
        const exactMatch = categorySlug.toLowerCase();  // e.g., "t-shirt"
        const noHyphen = categorySlug.toLowerCase().replace(/-/g, '');  // e.g., "tshirt"
        const withSpaces = categorySlug.toLowerCase().replace(/-/g, ' ');  // e.g., "t shirt"
        const titleCase = formatCategoryName(categorySlug);  // e.g., "T-shirt"
        
        // Find the standard category that best matches the slug
        const standardCategory = CATEGORIES.find(cat => 
          cat.toLowerCase() === exactMatch || 
          cat.toLowerCase() === noHyphen ||
          cat.toLowerCase() === withSpaces
        );
        
        console.log('Trying variations:', [exactMatch, noHyphen, withSpaces, titleCase]);
        console.log('Standard category match:', standardCategory);
        
        // First try exact match with the URL slug
        let { data } = await supabase
          .from('products')
          .select('*');
        
        // If we found a standard category match, use that
        if (standardCategory) {
          // For shirt category, make sure we don't include t-shirts
          if (standardCategory.toLowerCase() === 'shirt') {
            data = data.filter(product => 
              product.category && 
              (product.category === 'Shirt' || product.category === 'shirt')
            );
          } else {
            data = data.filter(product => 
              product.category && product.category.toLowerCase() === standardCategory.toLowerCase()
            );
          }
        } else {
          // Otherwise try with various possible formats
          data = data.filter(product => {
            if (!product.category) return false;
            const productCat = product.category.toLowerCase();
            return productCat === exactMatch || 
                   productCat === noHyphen || 
                   productCat === withSpaces || 
                   productCat.includes(exactMatch) ||
                   productCat.includes(noHyphen) ||
                   productCat.includes(withSpaces);
          });
        }
        
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