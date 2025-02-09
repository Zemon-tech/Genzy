import React, { useState, useEffect } from 'react';
import { HiSearch } from 'react-icons/hi';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All',
    'Shirts',
    'T-shirts',
    'Co-ords',
    'Sweatshirts',
    'Jeans',
    'Trousers',
    'Dresses',
    'Jackets',
    'Sweaters',
    'Activewear'
  ];

  // Mock search results - in real app, this would come from API
  const searchResults = [
    {
      id: 1,
      name: 'Classic White Shirt',
      price: '₹1,499',
      image: '/products/shirt1.jpg',
    },
    {
      id: 2,
      name: 'Black T-Shirt',
      price: '₹899',
      image: '/products/tshirt1.jpg',
    },
    // Add more mock products as needed
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase.from('products').select('*');
        
        if (activeCategory !== 'All') {
          query = query.eq('category', activeCategory);
        }
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, activeCategory]);

  return (
    <div className="pb-16 pt-4">
      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-4">
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full ${
                activeCategory === category
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg"></div>
                <div className="mt-2 h-4 bg-gray-200 rounded"></div>
                <div className="mt-1 h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : products.length === 0 ? (
            <p className="col-span-2 text-center text-gray-500 py-8">No products found</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {calculateDiscount(product.mrp, product.selling_price) > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {calculateDiscount(product.mrp, product.selling_price)}% OFF
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Search; 