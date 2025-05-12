import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../../components/product/ProductCard';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { BsGrid, BsViewList } from 'react-icons/bs';
import { Share2 } from 'lucide-react';
import supabase from '../../config/supabase';

// Define our color scheme
const COLORS = {
  black: "#292728",
  white: "#ffffff",
  gold: "#eaaa07"
};

const CollectionPage = () => {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collection, setCollection] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const navigate = useNavigate();
  
  // Format the collection name for display (convert slug to title case)
  const formatCollectionName = (slug) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const collectionName = formatCollectionName(name);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch collection metadata
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('name', name)
          .single();
        
        if (collectionError && collectionError.code !== 'PGRST116') {
          console.error('Error fetching collection metadata:', collectionError);
        } else {
          setCollection(collectionData || { name });
        }
        
        // Fetch products that have this collection in their collections array
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .contains('collections', [name])
          .order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        
        console.log(`Found ${productsData?.length || 0} products in collection`);
        setProducts(productsData || []);
      } catch (err) {
        console.error('Error fetching collection data:', err);
        setError(`Failed to load products: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [name]);

  // Handle share functionality for this specific collection
  const handleShareCollection = async () => {
    const shareText = "Brooo check this site 💀🔥 HavenDrip got actual student-led fashion drops. Not even on Instagram yet.";
    
    try {
      if (navigator.share) {
        console.log("Web Share API available, attempting to share");
        await navigator.share({
          title: `Haven Drip - ${collectionName} Collection`,
          text: shareText,
          url: window.location.href,
        });
        console.log('Content shared successfully');
      } else {
        console.log("Web Share API not available, using clipboard fallback");
        // Fallback for browsers that don't support Web Share API
        const shareMessage = `${shareText} ${window.location.href}`;
        await navigator.clipboard.writeText(shareMessage);
        alert('Share message copied to clipboard! Paste it to share with friends.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Additional fallback if clipboard API fails
      if (error.name === 'NotAllowedError') {
        alert('Permission to share was denied. You can manually copy the current URL.');
      } else {
        try {
          // Try clipboard as a last resort
          const shareMessage = `${shareText} ${window.location.href}`;
          await navigator.clipboard.writeText(shareMessage);
          alert('Share message copied to clipboard! Paste it to share with friends.');
        } catch (clipboardError) {
          console.error('Clipboard fallback failed:', clipboardError);
          alert('Unable to share. Please manually copy the URL from your address bar.');
        }
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen max-w-[480px] mx-auto"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Header with back button - Redesigned for a 2030 look */}
      <div className="sticky top-0 z-10 backdrop-blur-md border-b border-[#eaaa07]/10" style={{ backgroundColor: "#ffffffE6" }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-[#eaaa07]/10 transition-colors"
              style={{ backgroundColor: `${COLORS.black}05` }}
              aria-label="Back"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-[#292728]" />
            </button>
            <h1 className="text-2xl font-bold text-[#292728]">
              {collectionName}
              <span className="ml-2 text-sm font-normal bg-[#eaaa07] text-[#292728] px-2 py-0.5 rounded-full">Collection</span>
            </h1>
          </div>
          
          {/* Share button */}
          <motion.button
            onClick={handleShareCollection}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-[#eaaa07]/10 hover:bg-[#eaaa07]/20 transition-colors"
            aria-label="Share collection"
          >
            <Share2 className="w-5 h-5 text-[#292728]" />
          </motion.button>
        </div>
      </div>

      {/* Collection Banner - Enhanced for a more futuristic look */}
      {collection?.banner_url && (
        <div className="w-full mb-6 relative">
          <div className="w-full h-56 overflow-hidden rounded-b-3xl">
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2 }}
              src={collection.banner_url} 
              alt={`${collectionName} banner`} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Gradient overlay with more modern design */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#292728]/70 via-[#292728]/30 to-transparent rounded-b-3xl"></div>
          
          {/* Collection name overlay with improved typography */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold text-white drop-shadow-md"
            >
              {collectionName}
            </motion.h2>
          </div>
        </div>
      )}

      {/* Collection Description with better typography */}
      {collection?.description && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-4 mb-6"
        >
          <p className="text-[#292728] leading-relaxed text-lg">{collection.description}</p>
        </motion.div>
      )}
      
      {/* Share Button - Prominent placement to encourage sharing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="px-4 mb-6"
      >
        <button
          onClick={handleShareCollection}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#292728] to-[#000] text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Share2 size={18} />
          <span>Share This Collection 🔥</span>
        </button>
        <p className="text-center text-[#292728]/60 text-xs mt-2">
          Put your friends on this fire collection
        </p>
      </motion.div>

      {/* View controls - Enhanced with more modern styling */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="text-sm bg-[#292728]/5 px-3 py-1 rounded-full text-[#292728]">
          {!loading && !error && (
            <span className="font-medium">{products.length} product{products.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className="flex items-center p-1 bg-[#292728]/5 rounded-full">
          <button 
            className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-[#eaaa07] text-[#292728] shadow-md' : 'text-[#292728]/70'}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <BsGrid className="w-4 h-4" />
          </button>
          <button 
            className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-[#eaaa07] text-[#292728] shadow-md' : 'text-[#292728]/70'}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <BsViewList className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* Loading State - More modern and animated */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-2 border-[#eaaa07]/20 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-[#eaaa07] rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-t-2 border-[#eaaa07]/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-4 border-t-2 border-[#eaaa07]/30 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
              </div>
              <p className="text-[#eaaa07] font-medium mt-4">Loading products</p>
            </div>
          </div>
        )}

        {/* Error State - Enhanced design */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 p-6 rounded-2xl mb-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-lg font-medium mb-1">Oops! Something went wrong</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Products Grid - Improved styling for a 2030 look */}
        {!loading && !error && (
          <>
            {Array.isArray(products) && products.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                      className="flex items-center border border-[#eaaa07]/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                      style={{ backgroundColor: COLORS.white }}
                    >
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100">
                        {product.images && product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3">
                        <h3 className="font-medium text-[#292728]">{product.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-baseline">
                            <span className="text-[#eaaa07] font-bold">₹{product.selling_price}</span>
                            {product.mrp > product.selling_price && (
                              <span className="ml-2 text-sm text-[#292728]/50 line-through">₹{product.mrp}</span>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-[#eaaa07]/10 text-[#292728] rounded-full">
                            {Math.round((1 - product.selling_price / product.mrp) * 100)}% off
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-16 bg-[#292728]/5 rounded-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full border border-[#292728]/10 mb-4">
                  <svg className="w-10 h-10 text-[#292728]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <p className="text-[#292728]/70 text-lg font-medium mb-6">No products found in this collection</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-[#eaaa07] text-[#292728] rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Back to Home
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CollectionPage; 