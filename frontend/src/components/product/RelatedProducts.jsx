import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';
import { motion } from 'framer-motion';

const RelatedProducts = ({ category, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [category, currentProductId]);

  const fetchRelatedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, sellers(brand_name)')
        .eq('category', category)
        .neq('id', currentProductId)
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-8">Similar Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mt-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Similar Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link
              to={`/product/${product.id}`}
              className="group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1">
                  {product.sellers?.brand_name || 'Brand'}
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-bold">₹{product.selling_price}</span>
                  <span className="text-xs text-gray-500 line-through">
                    ₹{product.mrp}
                  </span>
                  {calculateDiscount(product.mrp, product.selling_price) > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      ({calculateDiscount(product.mrp, product.selling_price)}% off)
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

RelatedProducts.propTypes = {
  category: PropTypes.string.isRequired,
  currentProductId: PropTypes.string.isRequired
};

export default RelatedProducts; 