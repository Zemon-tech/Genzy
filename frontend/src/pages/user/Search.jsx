import { useState, useEffect } from 'react';
import { HiSearch, HiAdjustments, HiX } from 'react-icons/hi';
import supabase from '../../config/supabase';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, STYLE_TYPES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gender, setGender] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [brandNames, setBrandNames] = useState([]); // To store all available brand names
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  
  // Define categories and styles - include 'all' option first
  const filterCategories = ['all', ...CATEGORIES.map(cat => cat.toLowerCase())];
  const filterStyles = ['all', ...STYLE_TYPES.map(style => style.toLowerCase())];

  const navigate = useNavigate();

  // Fetch all brand names for better search
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await supabase
          .from('sellers')
          .select('brand_name')
          .not('brand_name', 'is', null);
        
        if (data) {
          const names = data.map(item => item.brand_name.toLowerCase());
          setBrandNames(['all', ...names]); // Add 'all' as first option
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    
    fetchBrands();
  }, []);

  // Initial load and URL parameter handling
  useEffect(() => {
    const discountFromUrl = searchParams.get('discount');
    const sortFromUrl = searchParams.get('sort');
    const queryFromUrl = searchParams.get('query');
    const categoryFromUrl = searchParams.get('category');
    const styleFromUrl = searchParams.get('style');
    const brandFromUrl = searchParams.get('brand');
    const genderFromUrl = searchParams.get('gender');

    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    }
    
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    
    if (styleFromUrl) {
      setSelectedStyle(styleFromUrl);
    }
    
    if (brandFromUrl) {
      setSelectedBrand(brandFromUrl);
    }
    
    if (genderFromUrl) {
      setGender(genderFromUrl);
    }

    fetchProducts({
      gender: genderFromUrl || gender,
      category: categoryFromUrl || selectedCategory,
      style: styleFromUrl || selectedStyle,
      brand: brandFromUrl || selectedBrand,
      discount: discountFromUrl === 'true',
      sort: sortFromUrl,
      searchQuery: queryFromUrl
    });
  }, [searchParams]); // Only react to URL changes

  // Handle filter changes
  useEffect(() => {
    applyFilters();
  }, [gender, selectedCategory, selectedStyle, selectedBrand]);

  const applyFilters = () => {
    fetchProducts({
      gender,
      category: selectedCategory,
      style: selectedStyle,
      brand: selectedBrand,
      searchQuery
    });
  };

  const resetFilters = () => {
    setGender('all');
    setSelectedCategory('all');
    setSelectedStyle('all');
    setSelectedBrand('all');
    setIsFilterOpen(false);
  };

  const findClosestBrand = (query) => {
    if (!query || brandNames.length === 0) return null;
    
    // Normalize the query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Direct match
    if (brandNames.includes(normalizedQuery)) {
      return normalizedQuery;
    }
    
    // Find brands that include the query as a substring
    const matchingBrands = brandNames.filter(brand => 
      brand !== 'all' && (brand.includes(normalizedQuery) || normalizedQuery.includes(brand))
    );
    
    if (matchingBrands.length > 0) {
      return matchingBrands;
    }
    
    // Check for typos or close matches
    const closeMatches = brandNames.filter(brand => {
      if (brand === 'all') return false;
      
      const minLength = Math.min(brand.length, normalizedQuery.length);
      if (minLength < 3) return false; // Skip very short brands
      
      let matchingChars = 0;
      for (let i = 0; i < normalizedQuery.length; i++) {
        if (brand.includes(normalizedQuery[i])) {
          matchingChars++;
        }
      }
      
      const matchPercentage = matchingChars / normalizedQuery.length;
      return matchPercentage > 0.6;
    });
    
    return closeMatches.length > 0 ? closeMatches : null;
  };

  const fetchProducts = async ({ gender, searchQuery, discount, sort, category, style, brand }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, sellers(brand_name)');

      // Apply gender filter
      if (gender && gender !== 'all') {
        query = query.in('gender', [gender, 'unisex']);
      }
      
      // Apply category filter - make exact category matching to prevent overlap
      if (category && category !== 'all') {
        // For shirt category, ensure we don't include t-shirts by using exact matching
        if (category === 'shirt') {
          query = query.eq('category', 'Shirt');
        } else {
          query = query.ilike('category', `%${category}%`);
        }
      }
      
      // Apply direct brand filter if selected
      if (brand && brand !== 'all') {
        query = query.ilike('sellers.brand_name', `%${brand}%`);
      }
      
      // Apply style filter - search in description and name
      if (style && style !== 'all') {
        query = query.or(`description.ilike.%${style}%,name.ilike.%${style}%`);
      }

      // Enhanced search logic
      if (searchQuery) {
        // Normalize search query
        const normalizedQuery = searchQuery.toLowerCase().trim();
        
        // Check if query might be a brand name (including typos)
        const potentialBrands = findClosestBrand(normalizedQuery);
        
        if (potentialBrands && brand === 'all') { // Only apply if brand filter not set
          // Brand search
          console.log('Brand search detected:', potentialBrands);
          
          if (Array.isArray(potentialBrands)) {
            const brandFilters = potentialBrands.map(brand => 
              `sellers.brand_name.ilike.%${brand}%`
            ).join(',');
            query = query.or(brandFilters);
          } else {
            query = query.ilike('sellers.brand_name', `%${potentialBrands}%`);
          }
        } else {
          // For category/type of products search
          const categoryTerms = [
            'shirt', 'tshirt', 't-shirt', 'jeans', 'trousers', 'pant', 'jacket', 
            'sweater', 'sweatshirt', 'co-ord', 'coord'
          ];
          
          // For style/occasion search
          const styleTerms = [
            'trendy', 'casual', 'formal', 'party', 'college', 'office', 'work',
            'summer', 'winter', 'spring', 'autumn', 'festive'
          ];
          
          // Check if any category term is present in the search query
          const matchedCategories = categoryTerms.filter(term => 
            normalizedQuery.includes(term)
          );
          
          // Check if any style term is present in the search query
          const matchedStyles = styleTerms.filter(term => 
            normalizedQuery.includes(term)
          );
          
          // If searching for a category and no category filter applied
          if (matchedCategories.length > 0 && category === 'all') {
            // Build a complex query with similar categories and possible variations
            const categoryFilters = matchedCategories.map(category => {
              // Handle common variations, e.g., tshirt -> t-shirt
              let variations = [category];
              if (category === 'tshirt') variations.push('t-shirt');
              if (category === 't-shirt') variations.push('tshirt');
              if (category === 'pant') variations.push('trousers');
              if (category === 'coord') variations.push('co-ord');
              
              // Build OR conditions for each variation
              return variations.map(variation => 
                `category.ilike.%${variation}%`
              ).join(',');
            }).join(',');
            
            query = query.or(categoryFilters);
          }
          // If searching for a style/occasion and no style filter applied
          else if (matchedStyles.length > 0 && style === 'all') {
            // Search in description and name fields for style terms
            query = query.or(
              `description.ilike.%${normalizedQuery}%,name.ilike.%${normalizedQuery}%`
            );
          }
          // General search across all fields
          else {
            query = query.or(
              `name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%,category.ilike.%${normalizedQuery}%`
            );
          }
        }
      }

      if (discount) {
        query = query.gt('discount_percentage', 0);
      }

      // Apply sorting
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'trending') {
        query = query.order('views', { ascending: false });
      }

      console.log('Executing search query for:', searchQuery);
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Log the results to help with debugging
      console.log(`Found ${data?.length || 0} products for query "${searchQuery}"`);
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input with debounce to prevent too many API calls
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any existing timeouts
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a timeout to execute the search after 500ms of user inactivity
    window.searchTimeout = setTimeout(() => {
      fetchProducts({
        gender,
        category: selectedCategory,
        style: selectedStyle,
        brand: selectedBrand,
        searchQuery: value
      });
    }, 500);
  };

  // Check if any filters are applied
  const areFiltersApplied = gender !== 'all' || selectedCategory !== 'all' || selectedStyle !== 'all' || selectedBrand !== 'all';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[480px] mx-auto">
        {/* Brand Header with Dark Background - Reduced height */}
        <div className="bg-[#292728] px-4 pt-2 pb-5">
          {/* SVG Logo positioned more to the left and lower */}
          <div className="flex justify-center pr-1 pt-1">
            <img 
              src="/photologo.svg" 
              alt="Brand Logo" 
              className="h-12 object-contain drop-shadow-lg"
            />
          </div>
        </div>
        
        {/* Premium Search Bar - positioned higher with half on colored background */}
        <div className="relative px-4 -mt-5">
          <input
            type="text"
            placeholder="Search products, brands, styles..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="w-full pl-10 pr-14 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-gray-400 shadow-lg"
          />
          <HiSearch className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="absolute right-7 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 rounded-full bg-gray-100"
          >
            <HiAdjustments className="w-4 h-4" />
          </button>
        </div>

        {/* Content area with spacing from dark header */}
        <div className="pt-6">
          {/* Active Filters Indicators */}
          {areFiltersApplied && (
            <div className="px-4 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                <span className="text-xs text-gray-500">Filters:</span>
                
                {gender !== 'all' && (
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <span>{gender === 'male' ? 'Gente' : 'Lade'}</span>
                    <button onClick={() => setGender('all')} className="hover:text-blue-600">
                      <HiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {selectedCategory !== 'all' && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <span>{selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('all')} className="hover:text-green-600">
                      <HiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {selectedStyle !== 'all' && (
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <span>{selectedStyle}</span>
                    <button onClick={() => setSelectedStyle('all')} className="hover:text-purple-600">
                      <HiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {selectedBrand !== 'all' && (
                  <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <span>{selectedBrand}</span>
                    <button onClick={() => setSelectedBrand('all')} className="hover:text-orange-600">
                      <HiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={resetFilters}
                  className="text-xs text-gray-500 hover:text-red-500 ml-1"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Filter Popup Modal */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                className="fixed inset-0 bg-[#292728]/50 z-50 flex items-end justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
              >
                <motion.div 
                  className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[80vh] overflow-y-auto"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white z-10 p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Filters</h3>
                      <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
                      >
                        <HiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Filter Content */}
                  <div className="p-4 space-y-6">
                    {/* Gender Filter - moved from main page to here */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Gender</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setGender('all')}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            gender === 'all'
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          All Genders
                        </button>
                        <button
                          onClick={() => setGender('male')}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            gender === 'male'
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Gente
                        </button>
                        <button
                          onClick={() => setGender('female')}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            gender === 'female'
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Lade
                        </button>
                      </div>
                    </div>
                    
                    {/* Categories Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {filterCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              selectedCategory === category
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {category === 'all' ? 'All Categories' : category}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Styles Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Styles & Occasions</h4>
                      <div className="flex flex-wrap gap-2">
                        {filterStyles.map(style => (
                          <button
                            key={style}
                            onClick={() => setSelectedStyle(style)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              selectedStyle === style
                                ? 'bg-purple-100 text-purple-800 font-medium'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {style === 'all' ? 'All Styles' : style}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Brands Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Brands</h4>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {brandNames.map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              selectedBrand === brand
                                ? 'bg-orange-100 text-orange-800 font-medium'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {brand === 'all' ? 'All Brands' : brand}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3 pb-24">
                    <button
                      onClick={resetFilters}
                      className="flex-1 py-2.5 rounded-lg text-gray-600 font-medium bg-gradient-to-r from-transparent via-gray-300 to-transparent bg-[length:100%_1px] bg-bottom bg-no-repeat hover:bg-[length:100%_2px] transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        applyFilters();
                        setIsFilterOpen(false);
                      }}
                      className="flex-1 py-2.5 rounded-lg text-[#292728] font-medium bg-gradient-to-r from-[#eaaa07]/50 via-[#eaaa07] to-[#eaaa07]/50 bg-[length:100%_1px] bg-bottom bg-no-repeat hover:bg-[length:100%_2px] transition-all"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Results */}
          <div className="px-4">
            {searchQuery && (
              <div className="mb-4 text-sm text-gray-600">
                <p>Showing results for: <span className="font-medium">{searchQuery}</span></p>
              </div>
            )}
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

            {/* Explore Havendrip Collection - shown when products exist */}
            {!loading && products.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 mb-12 bg-gradient-to-br from-[#292728] to-[#292728]/90 rounded-xl overflow-hidden shadow-md"
              >
                <div className="p-4 text-white">
                  <h3 className="text-lg font-bold mb-1 flex items-center">
                    <span className="mr-2">Explore Havendrip</span>
                    <span className="text-[#eaaa07]">Collection</span>
                  </h3>
                  <p className="text-xs text-white/80 mb-2">
                    Discover our exclusive premium collection with unique designs.
                  </p>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-3 h-3 text-[#eaaa07]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
                
                <div className="relative h-32 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#292728] to-transparent z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                    alt="Havendrip Collection Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="px-4 py-3 flex items-center justify-between bg-[#eaaa07]/10">
                  <span className="text-[#eaaa07] text-sm font-medium">Premium Collection</span>
                  <button 
                    onClick={() => navigate('/collections')} 
                    className="px-3 py-1.5 bg-[#eaaa07] text-[#292728] rounded-full text-xs font-medium transition-all hover:shadow-md flex items-center"
                  >
                    Explore
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Explore Havendrip Collection - shown when no products found */}
            {!loading && products.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 mb-12 bg-gradient-to-br from-[#292728] to-[#292728]/90 rounded-xl overflow-hidden shadow-md"
              >
                <div className="p-4 text-white">
                  <h3 className="text-lg font-bold mb-1">We couldn&apos;t find what you&apos;re looking for</h3>
                  <p className="text-xs text-white/80 mb-2">
                    Check out our exclusive Havendrip Collection instead!
                  </p>
                </div>
                
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#292728] to-transparent z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1551232864-3f0890e580d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" 
                    alt="Havendrip Collection Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-3 flex flex-col items-center">
                  <button 
                    onClick={() => navigate('/collections')}
                    className="w-full py-2 bg-[#eaaa07] text-[#292728] rounded-full text-sm font-medium transition-all hover:shadow-md flex items-center justify-center"
                  >
                    Explore Havendrip Collection
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search; 