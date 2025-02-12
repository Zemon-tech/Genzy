import React, { useState, useEffect } from 'react';
import ImageCarousel from '../../components/ImageCarousel';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import BrandSlider from '../../components/BrandSlider';
import { HiSearch } from 'react-icons/hi';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const carouselSlides = [
    {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070',
      content: (
        <>
          <h1 className="text-4xl font-bold mb-3">New Season Arrivals</h1>
          <p className="text-lg mb-6 opacity-90">Discover the latest trends in fashion</p>
          <Link 
            to="/search" 
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
        </>
      )
    },
    {
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071',
      content: (
        <>
          <h1 className="text-4xl font-bold mb-3">Summer Collection 2024</h1>
          <p className="text-lg mb-6 opacity-90">Beat the heat with our cool collection</p>
          <Link 
            to="/search?category=summer" 
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Explore Summer
          </Link>
        </>
      )
    },
    {
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070',
      content: (
        <>
          <h1 className="text-4xl font-bold mb-3">Exclusive Brands</h1>
          <p className="text-lg mb-6 opacity-90">Shop your favorite designer brands</p>
          <Link 
            to="/search?type=premium" 
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            View Brands
          </Link>
        </>
      )
    },
    {
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070',
      content: (
        <>
          <h1 className="text-4xl font-bold mb-3">Trending Now</h1>
          <p className="text-lg mb-6 opacity-90">Stay ahead with the latest fashion trends</p>
          <Link 
            to="/search?sort=trending" 
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            Shop Trending
          </Link>
        </>
      )
    },
    {
      image: 'https://images.unsplash.com/photo-1445108771704-4d82e8e60a8b?q=80&w=2070',
      content: (
        <>
          <h1 className="text-4xl font-bold mb-3">Special Offers</h1>
          <p className="text-lg mb-6 opacity-90">Up to 50% off on selected items</p>
          <Link 
            to="/search?discount=true" 
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            View Offers
          </Link>
        </>
      )
    }
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

  const ProductsSection = React.memo(() => (
    <section className="py-8 px-4">
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
  ));

  const MemoizedBrandSlider = React.memo(BrandSlider);

  return (
    <div className="min-h-screen bg-white hardware-accelerated">
      {/* Main Content */}
      <div className="max-w-[480px] mx-auto bg-white min-h-screen hardware-accelerated">
        {/* Enhanced Hero Section */}
        <div className="relative">
          {/* Search Bar Overlay */}
          <div className="absolute top-4 left-0 right-0 z-10 px-4">
            <div 
              onClick={() => navigate('/search')} 
              className="relative cursor-pointer"
            >
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none"
                readOnly
              />
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
            </div>
          </div>

          {/* Carousel Section */}
          <div className="h-[85vh]">
            <ImageCarousel 
              images={carouselSlides.map(slide => slide.image)}
              slides={carouselSlides.map(slide => slide.content)}
              autoPlayInterval={5000}
            />
          </div>
        </div>

        {/* Featured Brands */}
        <section className="py-6 px-4">
          <h2 className="text-xl font-bold text-center mb-4">Featured Brands</h2>
          <MemoizedBrandSlider brands={brands} />
        </section>

        {/* Categories */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-center mb-4">Shop by Category</h2>
          <div className="grid grid-cols-3 gap-1 px-1">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/search?category=${category.name}`}
                className="group relative block"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-cover brightness-[0.85] group-hover:brightness-75 transition-all duration-300"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-2">
                    <h3 className="text-white text-sm font-medium">
                      {category.name}
                    </h3>
                    <div className="flex items-center mt-0.5 text-white/90">
                      <span className="text-[10px] font-medium">Shop Now</span>
                      <svg
                        className="w-3 h-3 ml-0.5 transform group-hover:translate-x-1 transition-transform"
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