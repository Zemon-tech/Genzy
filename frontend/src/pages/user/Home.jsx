import React, { useState, useEffect } from 'react';
import ImageCarousel from '../../components/ImageCarousel';
import supabase from '../../config/supabase';
import { Link, useNavigationType } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { motion } from 'framer-motion';
import Footer from '../../components/user/Footer';
import { CATEGORIES, CATEGORY_IMAGES } from '../../utils/constants';
import ShareTheDrip from '../../components/ShareTheDrip';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch carousel slides
        const { data: slidesData, error: slidesError } = await supabase
          .from('carousel_slides')
          .select('*')
          .order('rank', { ascending: true });
          
        if (slidesError) {
          console.error('Error fetching carousel slides:', slidesError);
        } else {
          setCarouselSlides(slidesData || []);
        }
        
        // Fetch featured categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('featured_categories')
          .select('*')
          .order('rank', { ascending: true });
          
        if (categoriesError) {
          console.error('Error fetching featured categories:', categoriesError);
          
          // Use fallback data if we couldn't fetch from database
          setFeaturedCategories(generateFallbackCategories());
        } else {
          if (categoriesData && categoriesData.length > 0) {
            setFeaturedCategories(categoriesData);
          } else {
            // Use fallback data if there are no categories in the database
            setFeaturedCategories(generateFallbackCategories());
          }
        }
        
        // Fetch products with seller info - only brand_name
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, sellers(brand_name)')
          .limit(6);
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
        
        // Fetch unique collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .rpc('get_unique_collections');
          
        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
        } else {
          // Get collection names
          const collectionNames = (collectionsData || []).map(item => item.collection_name);
          
          // Get up to 5 most popular collections (for simplicity, we'll just take the first 5)
          const topCollections = collectionNames.slice(0, 5);
          
          if (topCollections.length > 0) {
            // For each collection, fetch a sample product to use as the image
            const collectionsWithImages = await Promise.all(
              topCollections.map(async (collectionName) => {
                // Get a sample product from this collection
                const { data: sampleProducts } = await supabase
                  .from('products')
                  .select('images')
                  .contains('collections', [collectionName])
                  .limit(1);
                
                const sampleImage = sampleProducts?.[0]?.images?.[0] || null;
                
                return {
                  name: collectionName,
                  image: sampleImage,
                  formatted_name: collectionName
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                };
              })
            );
            
            setCollections(collectionsWithImages);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);
  
  // Fallback function to generate default categories if database fetch fails
  const generateFallbackCategories = () => {
    // Create categories array combining promo and product categories
    return [
      // First two slots for news/sales updates
      {
        category_name: "Sale 50%+ OFF",
        image_url: "gg.gif", // Example sale gif
        type: "promo",
        link_url: "/sale",
        description: "Huge Discounts Limited Time"
      },
      {
        category_name: "New Arrivals",
        image_url: "ff.gif", // Example new arrivals gif
        type: "promo",
        link_url: "/new-arrivals",
        description: "Fresh Styles Just Dropped"
      },
      // Regular categories from constants
      ...CATEGORIES.map(category => ({
        category_name: category,
        image_url: CATEGORY_IMAGES[category],
        type: "category",
      }))
    ];
  };

  // Transform the carousel slides data to the format expected by ImageCarousel
  const transformedSlides = carouselSlides.map(slide => ({
    image: slide.image_url,
    content: (
      <>
        {slide.link_url ? (
          <Link to={slide.link_url} className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-1">{slide.title}</h1>
            <p className="text-md mb-1 text-[#eaaa07]">{slide.subtitle}</p>
          </Link>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-1">{slide.title}</h1>
            <p className="text-md mb-1 text-[#eaaa07]">{slide.subtitle}</p>
          </>
        )}
      </>
    )
  }));
  
  // Fallback carousel slides if no data is available
  const fallbackSlides = [
    {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070',
      content: (
        <>
          <Link to="/new-arrivals" className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-1">New Season Arrivals</h1>
            <p className="text-md mb-1 text-[#eaaa07]">Discover the latest trends in fashion</p>
          </Link>
        </>
      )
    },
    {
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071',
      content: (
        <>
          <Link to="/summer-collection" className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-1">Summer Collection 2024</h1>
            <p className="text-md mb-1 text-[#eaaa07]">Beat the heat with our cool collection</p>
          </Link>
        </>
      )
    },
    {
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070',
      content: (
        <>
          <Link to="/brands" className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold mb-1">Exclusive Brands</h1>
            <p className="text-md mb-1 text-[#eaaa07]">Shop your favorite designer brands</p>
          </Link>
        </>
      )
    }
  ];

  // Use the transformed slides or fallback if none available
  const slidesToShow = transformedSlides.length > 0 ? transformedSlides : fallbackSlides;

  // Products section component with display name
  const ProductsSection = React.memo(() => {
    const scrollContainerRef = React.useRef(null);
    
    // Scroll handling - only forward scroll now
    const scrollRight = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
      }
    };

    return (
      <section className="py-4 px-3">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Discover More
            </h2>
          </div>
        </div>

        {/* Products Horizontal Scroll Container */}
        <div className="relative">
          {/* Only Right Arrow - positioned at the end of visible products */}
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/60 shadow-sm text-gray-700 hover:bg-white/90 transition-all"
            aria-label="See more products"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto hide-scrollbar pb-4 no-flicker"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex items-stretch min-w-full">
              {/* First 5 Products */}
              <div className="flex gap-3">
                {products.slice(0, 5).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="min-w-[170px] max-w-[170px] flex-shrink-0"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
              
              {/* View All Link - positioned at the end as a card */}
              {products.length > 5 && (
                <Link 
                  to="/search" 
                  className="min-w-[170px] max-w-[170px] h-full ml-4 flex-shrink-0 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#eaaa07]/30 hover:border-[#eaaa07] transition-all group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 rounded-full bg-[#eaaa07]/10 flex items-center justify-center mb-3 group-hover:bg-[#eaaa07]/20 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#eaaa07]">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600 group-hover:text-[#292728] transition-all">View All</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </section>
    );
  });
  
  // Set display name to fix linter error
  ProductsSection.displayName = 'ProductsSection';

  // Get promo and regular categories
  const promoCategories = featuredCategories.filter(cat => cat.type === 'promo');
  const regularCategories = featuredCategories.filter(cat => cat.type === 'category');

  // Featured Collections component
  const FeaturedCollections = React.memo(() => {
    // Auto-scroll logic
    const scrollContainerRef = React.useRef(null);
    const [isHovering, setIsHovering] = React.useState(false);
    const navigationType = useNavigationType();
    const isReturningToPage = navigationType === 'POP';
    
    React.useEffect(() => {
      // Only auto-scroll if we have collections and user isn't hovering
      if (collections.length > 0 && scrollContainerRef.current && !isHovering) {
        const scrollContainer = scrollContainerRef.current;
        let animationId;
        let position = scrollContainer.scrollLeft || 0;
        
        const scrollSpeed = 0.5; // pixels per frame
        const scrollWidth = scrollContainer.scrollWidth;
        const clientWidth = scrollContainer.clientWidth;
        
        const autoScroll = () => {
          // Reset to beginning when reaching the end with a small buffer
          if (position >= scrollWidth - clientWidth - 10) {
            position = 0;
            scrollContainer.scrollLeft = 0;
          } else {
            position += scrollSpeed;
            scrollContainer.scrollLeft = position;
          }
          
          animationId = requestAnimationFrame(autoScroll);
        };
        
        // Start auto-scrolling after a small delay to prevent flickering
        const timeoutId = setTimeout(() => {
          animationId = requestAnimationFrame(autoScroll);
        }, 500);
        
        // Clean up
        return () => {
          if (animationId) {
            cancelAnimationFrame(animationId);
          }
          clearTimeout(timeoutId);
        };
      }
    }, [collections.length, isHovering]);
    
    return collections.length > 0 ? (
      <div className="mx-auto px-3 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">The Drip Haven</h2>
          <Link to="/collections" className="text-sm px-3 py-1 rounded-full transition-all bg-[#eaaa07] text-[#292728] font-medium">
            View All
          </Link>
        </div>
        
        {/* Wrapper with relative positioning for gradients */}
        <div className="relative">
          {/* Thinner gradient fades at edges - positioned outside scroll container */}
          <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto hide-scrollbar pb-6 pt-2 no-flicker"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={() => setIsHovering(true)}
            onTouchEnd={() => setIsHovering(false)}
          >
            {/* Custom scrollbar and anti-flicker styling */}
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                height: 4px;
              }
              .hide-scrollbar::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .hide-scrollbar::-webkit-scrollbar-thumb {
                background: #eaaa07;
                border-radius: 10px;
              }
              .no-flicker {
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
                perspective: 1000;
                -webkit-perspective: 1000;
              }
            `}</style>
            
            <div className="flex gap-4 pb-1">
              {collections.map((collection, index) => (
                <Link 
                  key={collection.name} 
                  to={`/collection/${collection.name}`}
                  className="min-w-[180px] flex-shrink-0 group"
                >
                  <motion.div
                    initial={isReturningToPage ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="relative bg-gray-50 rounded-2xl w-[180px] h-[200px] overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-all border border-[#eaaa07]/10 no-flicker"
                  >
                    {collection.image ? (
                      <>
                        <img 
                          src={collection.image} 
                          alt={collection.formatted_name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/600x600?text=Collection';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#292728]/70 to-transparent group-hover:from-[#292728]/80 transition-all duration-300"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                        <span className="p-2 bg-white/80 rounded-lg">No Image</span>
                      </div>
                    )}
                    
                    {/* Bottom label */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 transform group-hover:translate-y-0 group-hover:opacity-100">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {collection.formatted_name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-[#eaaa07] text-xs font-medium bg-[#292728]/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          Explore Collection
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : null;
  });
  
  // Set display name to fix linter error
  FeaturedCollections.displayName = 'FeaturedCollections';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Hero Section */}
        <div className="h-[70vh] relative">
          {/* Carousel Section */}
          <div className="h-full">
            {/* SVG Logo - Added directly to carousel */}
            <div className="absolute top-6 left-0 right-0 z-20 flex justify-center pr-1">
              <div className="flex flex-col items-center">
                <img 
                  src="/photologo.svg" 
                  alt="Brand Logo" 
                  className="h-12 object-contain z-20 drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Dark gradient overlay for top of carousel */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#292728]/80 via-[#292728]/50 to-transparent z-10"></div>
            
            <ImageCarousel 
              images={slidesToShow.map(slide => slide.image)}
              slides={slidesToShow.map((slide, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  {/* Extract title and subtitle from the content */}
                  {slide.content}
                </div>
              ))}
              autoPlayInterval={5000}
              showArrows={false}
            />
          </div>
        </div>

        {/* Featured Categories */}
        <section className="py-6 px-4">
          <h2 className="text-lg font-bold mb-4">Featured Categories</h2>
          
          {/* First Row - Large Promo Cards */}
          {promoCategories.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {promoCategories.slice(0, 2).map((category) => (
                <Link
                  key={category.id || category.category_name}
                  to={category.link_url || '#'}
                  className="group relative block rounded-2xl overflow-hidden aspect-[4/5] shadow-sm"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={category.image_url}
                      alt={category.category_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#292728]/5 via-[#292728]/20 to-[#292728]/80">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-xl mb-1">
                        {category.category_name}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Scrollable Categories Row - Simplified Cards */}
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-3 pb-2">
              {regularCategories.map((category) => {
                // Properly create slug from category name
                // If category name already has hyphens, preserve them
                const categorySlug = category.category_name
                  .toLowerCase()
                  .replace(/\s+/g, '-'); // Replace spaces with hyphens
                
                return (
                  <Link
                    key={category.id || category.category_name}
                    to={category.link_url || `/category/${categorySlug}`}
                    className="group flex-shrink-0 relative block w-32 rounded-xl overflow-hidden aspect-[3/4] shadow-sm"
                  >
                    <img
                      src={category.image_url}
                      alt={category.category_name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#292728]/60">
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <h3 className="text-white font-medium text-sm">
                          {category.category_name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Share The Drip banner - for users to share with friends */}
        <ShareTheDrip />

        {/* Add Featured Collections */}
        <FeaturedCollections />

        {/* New Arrivals Section */}
        <ProductsSection />

        {/* Footer (replacing partnered brands section) */}
        <Footer />
      </div>
    </div>
  );
};

export default Home; 