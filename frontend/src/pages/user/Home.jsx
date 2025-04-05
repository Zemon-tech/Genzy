import React, { useState, useEffect } from 'react';
import ImageCarousel from '../../components/ImageCarousel';
import supabase from '../../config/supabase';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { HiSearch } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../../components/user/Footer';
import { CATEGORIES, CATEGORY_IMAGES } from '../../utils/constants';

const Home = () => {
  const [products, setProducts] = useState([]);
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

  // Create categories array combining promo and product categories
  const categories = [
    // First two slots for news/sales updates
    {
      name: "Sale 50%+ OFF",
      image: "gg.gif", // Example sale gif
      type: "promo",
      link: "/sale",
      description: "Huge Discounts Limited Time"
    },
    {
      name: "New Arrivals",
      image: "ff.gif", // Example new arrivals gif
      type: "promo",
      link: "/new-arrivals",
      description: "Fresh Styles Just Dropped"
    },
    // Regular categories from constants
    ...CATEGORIES.map(category => ({
      name: category,
      image: CATEGORY_IMAGES[category],
      type: "category",
    }))
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products with seller info - only brand_name
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, sellers(brand_name)')
          .limit(6);
        
        if (productsError) throw productsError;
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Products section component with display name
  const ProductsSection = React.memo(() => (
    <section className="py-4 px-3">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Discover More
          </h2>
        </div>
      </div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        <motion.div 
          key="all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-2"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </section>
  ));
  
  // Set display name to fix linter error
  ProductsSection.displayName = 'ProductsSection';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Hero Section */}
        <div className="h-[85vh] relative">
          {/* Search Bar Overlay */}
          <div className="absolute top-4 left-0 right-0 z-10 px-4">
            <div 
              onClick={() => navigate('/search')} 
              className="relative cursor-pointer"
            >
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-3.5 bg-black/40 backdrop-blur-md border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none shadow-lg"
                readOnly
              />
              <HiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
            </div>
          </div>

          {/* Carousel Section */}
          <div className="h-full">
            <ImageCarousel 
              images={carouselSlides.map(slide => slide.image)}
              slides={carouselSlides.map((slide, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold mb-1">{slide.content.props.children[0].props.children}</h1>
                  <p className="text-sm mb-3 opacity-90">{slide.content.props.children[1].props.children}</p>
                  {slide.content.props.children[2]}
                </div>
              ))}
              autoPlayInterval={5000}
            />
          </div>
        </div>

        {/* Featured Categories */}
        <section className="py-6 px-4">
          <h2 className="text-lg font-bold mb-4">Featured Categories</h2>
          
          {/* First Row - Large Promo Cards */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {categories.slice(0, 2).map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className="group relative block rounded-2xl overflow-hidden aspect-[4/5] shadow-sm"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/80">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-xl mb-1">
                      {category.name}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Scrollable Categories Row - Simplified Cards */}
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-3 pb-2">
              {categories.slice(2).map((category) => {
                // Properly create slug from category name
                // If category name already has hyphens, preserve them
                const categorySlug = category.name
                  .toLowerCase()
                  .replace(/\s+/g, '-'); // Replace spaces with hyphens
                
                return (
                  <Link
                    key={category.name}
                    to={`/category/${categorySlug}`}
                    className="group flex-shrink-0 relative block w-32 rounded-xl overflow-hidden aspect-[3/4] shadow-sm"
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60">
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <h3 className="text-white font-medium text-sm">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* New Arrivals Section */}
        <ProductsSection />

        {/* Footer (replacing partnered brands section) */}
        <Footer />
      </div>
    </div>
  );
};

export default Home; 