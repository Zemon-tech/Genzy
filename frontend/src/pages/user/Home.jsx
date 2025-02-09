import React, { useState, useEffect } from 'react';
import ImageCarousel from '../../components/ImageCarousel';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import BrandSlider from '../../components/BrandSlider';

const Home = () => {
  const [gender, setGender] = useState('gente'); // gente for men, lade for women
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const carouselImages = [
    'https://images.unsplash.com/photo-1738705466275-1f94be26c5bd?q=80&w=1888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1721394744734-e367c1c40892?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1721902022374-e1f35db380dd?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  const brands = [
    { 
      id: 1, 
      name: 'Nike', 
      logo: 'https://pngimg.com/uploads/nike/nike_PNG11.png'
    },
    { 
      id: 2, 
      name: 'Adidas', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png'
    },
    { 
      id: 3, 
      name: 'Puma', 
      logo: 'https://logos-world.net/wp-content/uploads/2020/04/Puma-Logo.png'
    },
    { 
      id: 4, 
      name: 'Under Armour', 
      logo: 'https://download.logo.wine/logo/Under_Armour/Under_Armour-Logo.wine.png'
    },
    { 
      id: 5, 
      name: 'New Balance', 
      logo: 'https://logos-world.net/wp-content/uploads/2020/09/New-Balance-Logo.png'
    },
    { 
      id: 6, 
      name: 'Reebok', 
      logo: 'https://logos-world.net/wp-content/uploads/2020/04/Reebok-Logo.png'
    }
  ];

  const categories = [
    {
      name: 'T-Shirts',
      image: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg'
    },
    {
      name: 'Shirts',
      image: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg'
    },
    {
      name: 'Co-ords',
      image: 'https://images.pexels.com/photos/2896853/pexels-photo-2896853.jpeg'
    },
    {
      name: 'Sweatshirts',
      image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg'
    },
    {
      name: 'Jeans',
      image: 'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg'
    },
    {
      name: 'Trousers',
      image: 'https://images.pexels.com/photos/3768005/pexels-photo-3768005.jpeg'
    },
    {
      name: 'Jackets',
      image: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg'
    },
    {
      name: 'Sweaters',
      image: 'https://images.pexels.com/photos/45982/pexels-photo-45982.jpeg'
    },
    {
      name: 'Activewear',
      image: 'https://images.pexels.com/photos/2294342/pexels-photo-2294342.jpeg'
    }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .limit(6); // Fetch latest 6 products
          
        if (error) throw error;
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const ProductsSection = () => (
    <section className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">New Arrivals</h2>
        <Link to="/search" className="text-indigo-600 hover:text-indigo-700">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
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
        <section className="py-6">
          <h2 className="text-xl font-bold text-center mb-4">Featured Brands</h2>
          <BrandSlider brands={brands} />
        </section>

        {/* Categories */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-center mb-6">Shop by Category</h2>
          <div className="grid grid-cols-3 gap-2 px-2">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/search?category=${category.name}`}
                className="group relative block"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-lg">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-white text-sm font-medium tracking-wide">
                        {category.name}
                      </h3>
                      <div className="flex items-center mt-1 text-white/90">
                        <span className="text-xs font-medium">Shop Now</span>
                        <svg
                          className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Products */}
        <ProductsSection />
      </div>
    </div>
  );
};

export default Home; 