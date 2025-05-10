import React, { useState, useEffect } from 'react';
import ImageCarousel from '../../components/ImageCarousel';
import supabase from '../../config/supabase';
import { Link, useNavigationType } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../../components/user/Footer';
import { CATEGORIES, CATEGORY_IMAGES } from '../../utils/constants';

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
    const navigationType = useNavigationType();
    const isReturningToPage = navigationType === 'POP';

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

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key="all"
            initial={isReturningToPage ? false : { opacity: 0, y: 20 }}
            animate={isReturningToPage ? false : { opacity: 1, y: 0 }}
            exit={isReturningToPage ? false : { opacity: 0, y: -20 }}
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
    );
  });
  
  // Set display name to fix linter error
  ProductsSection.displayName = 'ProductsSection';

  // Get promo and regular categories
  const promoCategories = featuredCategories.filter(cat => cat.type === 'promo');
  const regularCategories = featuredCategories.filter(cat => cat.type === 'category');

  // Featured Collections component
  const FeaturedCollections = React.memo(() => {
    return collections.length > 0 ? (
      <div className="mx-auto px-3 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Trendy Collections</h2>
          <Link to="/collections" className="text-blue-600 text-sm">
            View All
          </Link>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
          {collections.map((collection) => (
            <Link 
              key={collection.name} 
              to={`/collection/${collection.name}`}
              className="min-w-[140px] flex-shrink-0"
            >
              <div className="bg-gray-100 rounded-full w-[140px] h-[140px] overflow-hidden mb-2">
                {collection.image ? (
                  <img 
                    src={collection.image} 
                    alt={collection.formatted_name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x600?text=Collection';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                    No Image
                  </div>
                )}
              </div>
              <p className="text-center font-medium truncate">
                {collection.formatted_name}
              </p>
            </Link>
          ))}
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