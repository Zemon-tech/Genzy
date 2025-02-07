import React, { useState } from 'react';
import ImageCarousel from '../../components/ImageCarousel';

const Home = () => {
  const [gender, setGender] = useState('gente'); // gente for men, lade for women
  
  const carouselImages = [
    'https://images.unsplash.com/photo-1738705466275-1f94be26c5bd?q=80&w=1888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1721394744734-e367c1c40892?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1721902022374-e1f35db380dd?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  const brands = [
    { 
      id: 1, 
      name: 'H&M', 
      logo: 'https://therockbury.com/app/uploads/2014/03/HM-logo.jpg'
    },
    { 
      id: 2, 
      name: 'Zara', 
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjNfikC9k9eTnCa0ZLnzhHZ1AwZwMojMyagQ&s'
    },
    { 
      id: 3, 
      name: 'Gucci', 
      logo: 'https://thumbs.dreamstime.com/b/gucci-logo-editorial-illustrative-white-background-eps-download-vector-jpeg-banner-gucci-logo-editorial-illustrative-white-208329393.jpg'
    },
    { 
      id: 4, 
      name: 'Chanel', 
      logo: 'https://www.shutterstock.com/image-vector/chanel-icon-logo-symbol-sign-600nw-2404629953.jpg'
    },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {/* Gender Toggle */}
        <div className="sticky top-0 bg-white z-20 shadow-sm">
          <div className="px-4 py-4">
            <div className="flex gap-4">
              <button
                onClick={() => setGender('gente')}
                className={`flex-1 px-6 py-2 rounded-full transition-colors ${
                  gender === 'gente'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Gente
              </button>
              <button
                onClick={() => setGender('lade')}
                className={`flex-1 px-6 py-2 rounded-full transition-colors ${
                  gender === 'lade'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Lade
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Hero Section with Carousel */}
          <div className="relative">
            <ImageCarousel images={carouselImages} />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <button className="bg-white/90 backdrop-blur-sm px-8 py-3 rounded-full shadow-lg font-semibold hover:bg-white transition-colors pointer-events-auto">
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
                  className="aspect-square bg-white rounded-lg flex items-center justify-center p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="w-full h-full object-contain"
                  />
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
      </div>
    </div>
  );
};

export default Home; 