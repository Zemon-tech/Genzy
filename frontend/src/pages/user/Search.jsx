import { useState, useEffect } from 'react';
import { HiSearch, HiAdjustments, HiX } from 'react-icons/hi';
import supabase from '../../config/supabase';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, STYLE_TYPES } from '../../utils/constants';

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
    <div className="pb-16 pt-4 relative">
      {/* Search Bar with Filter Button */}
      <div className="px-4 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products, brands, styles..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="w-full pl-10 pr-14 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
          >
            <HiAdjustments className="w-5 h-5" />
          </button>
        </div>
      </div>

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
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
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
              <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    applyFilters();
                    setIsFilterOpen(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-black text-white font-medium"
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
      </div>
    </div>
  );
};

export default Search; 