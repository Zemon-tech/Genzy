import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';

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
        .select('*')
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

  if (loading) return <div>Loading...</div>;
  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Similar Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="group"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                {product.name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold">₹{product.selling_price}</span>
                <span className="text-xs text-gray-500 line-through">
                  ₹{product.mrp}
                </span>
                {calculateDiscount(product.mrp, product.selling_price) > 0 && (
                  <span className="text-xs text-green-600">
                    ({calculateDiscount(product.mrp, product.selling_price)}% off)
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts; 