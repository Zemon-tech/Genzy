import React, { useState, useEffect } from 'react';
import ImageCarousel from '../../components/ImageCarousel';
import supabase from '../../config/supabase';
import { calculateDiscount } from '../../utils/helpers';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import BrandSlider from '../../components/BrandSlider';
import { HiSearch, HiAdjustments } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
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

  const categories = [
    // First two slots for news/sales updates
    {
      name: "Flash Sale",
      image: "gg.gif", // Example sale gif
      type: "promo",
      link: "/search?discount=true",
      description: "Up to 70% Off | Limited Time"
    },
    {
      name: "New Arrivals",
      image: "ff.gif", // Example new arrivals gif
      type: "promo",
      link: "/search?sort=newest",
      description: "Fresh Styles Just Dropped"
    },
    // Regular categories - matching the search page filters
    {
      name: "T-shirts",
      image: "https://m.media-amazon.com/images/I/61yHkZpT15L._SX679_.jpg",
      type: "category",
    },
    {
      name: "Shirts",
      image: "https://m.media-amazon.com/images/I/61ZZ0vbAhsL._SY879_.jpg",
      type: "category",
    },
    {
      name: "Co-ords",
      image: "https://m.media-amazon.com/images/I/61MVsaikwoL._SY879_.jpg",
      type: "category",
    },
    {
      name: "Sweatshirts",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
      type: "category",
    },
    {
      name: "Jeans",
      image: "https://m.media-amazon.com/images/I/81WzIbilc9L._SY879_.jpg",
      type: "category",
    },
    {
      name: "Trousers",
      image: "https://m.media-amazon.com/images/I/61FkSi+4MqL._SY879_.jpg",
      type: "category",
    },
    {
      name: "Jackets",
      image: "https://m.media-amazon.com/images/I/615fQ9S1m-L._SY879_.jpg",
      type: "category",
    },
    {
      name: "Sweaters",
      image: "https://m.media-amazon.com/images/I/71cinODyz-L._SX679_.jpg",
      type: "category",
    }
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

        // Fetch unique brands - only brand_name
        const { data: brandsData, error: brandsError } = await supabase
          .from('sellers')
          .select('brand_name')
          .not('brand_name', 'is', null);
        
        if (brandsError) throw brandsError;
        setBrands(brandsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products by brand
  const filteredProducts = selectedBrand
    ? products.filter(product => product.sellers?.brand_name === selectedBrand)
    : products;

  const ProductsSection = React.memo(() => (
    <section className="py-4 px-3">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-medium text-indigo-600 tracking-wider uppercase mb-0.5">
            Fresh Drops
          </h4>
          <h2 className="text-2xl font-bold tracking-tight">
            New Arrivals
          </h2>
        </div>

        {/* Filter Toggle Button */}
        <button 
          onClick={() => document.getElementById('brandFilters').scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"
        >
          <HiAdjustments className="w-5 h-5" />
          <span className="text-sm font-medium">Filter</span>
        </button>
      </div>

      {/* Brand Filters */}
      <div id="brandFilters" className="mb-4 -mx-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2 px-3">
          <motion.button
            onClick={() => setSelectedBrand(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${!selectedBrand 
                ? 'bg-black text-white shadow-lg scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            whileTap={{ scale: 0.95 }}
          >
            All Brands
          </motion.button>
          
          {brands.map((brand) => (
            <motion.button
              key={brand.brand_name}
              onClick={() => setSelectedBrand(brand.brand_name)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${selectedBrand === brand.brand_name 
                  ? 'bg-black text-white shadow-lg scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              whileTap={{ scale: 0.95 }}
            >
              {brand.brand_name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedBrand || 'all'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-2"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found for this brand</p>
        </div>
      )}
    </section>
  ));

  const MemoizedBrandSlider = React.memo(BrandSlider);

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
              slides={carouselSlides.map(slide => (
                <div className="flex flex-col items-center text-center">
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

        {/* Partnered Brands Section (renamed from Featured Brands) */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-center mb-4">Partnered Brands</h2>
          <div className="h-[12vh] bg-white/80 backdrop-blur-sm flex flex-col justify-center">
            <div className="flex-1 flex items-center overflow-hidden py-1">
              <MemoizedBrandSlider brands={brands} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home; 