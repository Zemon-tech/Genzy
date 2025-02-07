import React, { useState } from 'react';
import { HiSearch } from 'react-icons/hi';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Shirts', 'T-shirts', 'Co-ords', 'Sweatshirts'];

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
          {searchResults.map((product) => (
            <div key={product.id} className="rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-100"></div>
              <div className="p-2">
                <h3 className="text-sm font-medium truncate">{product.name}</h3>
                <p className="text-sm font-bold mt-1">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search; 