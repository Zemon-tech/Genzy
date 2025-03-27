import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../config/api';
import ProductCard from '../../components/product/ProductCard';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Format the category name for display (convert slug to title case)
  const formatCategoryName = (slug) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const categoryName = formatCategoryName(categorySlug);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the correct API URL without /api at the beginning since it's in baseURL
        const response = await api.get(`/products?category=${categorySlug}`);
        console.log('API Response:', response);
        
        // Check if we have valid data
        const data = response.data;
        
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} products`);
          setProducts(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          console.log(`Found ${data.data.length} products (nested)`);
          setProducts(data.data);
        } else {
          console.error('Unexpected data format:', data);
          setProducts([]);
          setError('Received unexpected data format from server');
        }
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