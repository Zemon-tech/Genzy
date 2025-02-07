import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Home = () => {
  const [gender, setGender] = useState('gente'); // gente for men, lade for women
  
  const carouselImages = [
    '/images/hero1.jpg',
    '/images/hero2.jpg',
    '/images/hero3.jpg',
  ];

  const brands = [
    { id: 1, name: 'Brand 1', logo: '/brands/logo1.png' },
    { id: 2, name: 'Brand 2', logo: '/brands/logo2.png' },
    { id: 3, name: 'Brand 3', logo: '/brands/logo3.png' },
    { id: 4, name: 'Brand 4', logo: '/brands/logo4.png' },
  ];

  const categories = [
    'Shirts',
    'T-shirts',
    'Co-ords',
    'Sweatshirts',
    'Jeans',
    'Jackets',
  ];

  return (
    <div className="pb-16"> {/* Space for bottom navigation */}
      {/* Gender Toggle */}
      <div className="flex justify-center gap-4 p-4 bg-white sticky top-0 z-10">
        <button
          onClick={() => setGender('gente')}
          className={`px-6 py-2 rounded-full ${
            gender === 'gente'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Gente
        </button>
        <button
          onClick={() => setGender('lade')}
          className={`px-6 py-2 rounded-full ${
            gender === 'lade'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Lade
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="bg-white px-8 py-3 rounded-full shadow-lg font-semibold">
            Shop Now
          </button>
        </div>
      </div>

      {/* Featured Brands */}
      <section className="p-4">
        <h2 className="text-xl font-bold mb-4">Featured Brands</h2>
        <div className="grid grid-cols-2 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <span className="text-gray-600">{brand.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="p-4">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
          {categories.map((category) => (
            <div
              key={category}
              className="flex-shrink-0 px-6 py-2 bg-gray-100 rounded-full"
            >
              {category}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home; 