import React, { useState, useEffect } from 'react';
import { HiSearch } from 'react-icons/hi';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [gender, setGender] = useState('all'); // 'all', 'male', 'female'
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
    fetchProducts();
  }, [gender, activeCategory]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*');

      // Apply gender filter
      if (gender === 'male') {
        query = query.in('gender', ['male', 'unisex']);
      } else if (gender === 'female') {
        query = query.in('gender', ['female', 'unisex']);
      }

      // Apply category filter if not 'All'
      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory);
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

      {/* Gender Filter */}
      <div className="px-4 mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setGender('all')}
            className={`flex-1 px-6 py-2 rounded-full transition-colors ${
              gender === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setGender('male')}
            className={`flex-1 px-6 py-2 rounded-full transition-colors ${
              gender === 'male'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Gente
          </button>
          <button
            onClick={() => setGender('female')}
            className={`flex-1 px-6 py-2 rounded-full transition-colors ${
              gender === 'female'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Lade
          </button>
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
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Search; 