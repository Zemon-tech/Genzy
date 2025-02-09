import { useState, useEffect } from 'react';
import supabase from '../../config/supabase';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { Skeleton } from '../ui/skeleton';
import { calculateDiscount } from '../../utils/helpers';

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { seller } = useSellerAuth();

  useEffect(() => {
    if (seller) {
      fetchSellerProducts();
    }
  }, [seller]);

  const fetchSellerProducts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching products for seller:', seller?.id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', seller?.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched products:', data);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
        
      if (error) throw error;
      
      // Remove product from local state
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEdit = (productId) => {
    // Navigate to edit page
    window.location.href = `/seller/edit-product/${productId}`;
  };

  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-y-auto flex-1 p-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Products</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Show 4 skeletons while loading
            [...Array(4)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))
          ) : (
            // Show actual products when loaded
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
                {/* Discount Badge */}
                {calculateDiscount(product.mrp, product.selling_price) > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {calculateDiscount(product.mrp, product.selling_price)}% OFF
                  </div>
                )}
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold">₹{product.selling_price}</span>
                        <span className="text-sm text-gray-500 line-through">₹{product.mrp}</span>
                        {calculateDiscount(product.mrp, product.selling_price) > 0 && (
                          <span className="text-green-600 text-sm">
                            ({calculateDiscount(product.mrp, product.selling_price)}% off)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(product.id)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">Stock: {product.stock_quantity}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No products found</p>
        )}
      </div>
    </div>
  );
};

export default SellerProducts; 