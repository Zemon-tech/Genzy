import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { Share2 } from 'lucide-react';
import supabase from '../../config/supabase';

// Define our color scheme
const COLORS = {
  black: "#292728",
  white: "#ffffff",
  gold: "#eaaa07"
};

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Format collection name for display (convert slug to title case)
  const formatCollectionName = (slug) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch unique collections
        const { data: collectionsData, error: collectionsError } = await supabase
          .rpc('get_unique_collections');
          
        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
          setError('Failed to load collections. Please try again later.');
          return;
        }
        
        // Get collection names
        const collectionNames = (collectionsData || []).map(item => item.collection_name);
        
        if (collectionNames.length > 0) {
          // For each collection, fetch a sample product to use as the image
          const collectionsWithImages = await Promise.all(
            collectionNames.map(async (collectionName) => {
              // Get a sample product from this collection
              const { data: sampleProducts } = await supabase
                .from('products')
                .select('images, name')
                .contains('collections', [collectionName])
                .limit(1);
              
              const sampleImage = sampleProducts?.[0]?.images?.[0] || null;
              
              // Get product count for this collection
              const { count, error: countError } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .contains('collections', [collectionName]);
                
              if (countError) {
                console.error('Error getting product count:', countError);
              }
              
              return {
                name: collectionName,
                image: sampleImage,
                formatted_name: formatCollectionName(collectionName),
                product_count: count || 0,
                sample_product: sampleProducts?.[0]?.name || ''
              };
            })
          );
          
          setCollections(collectionsWithImages);
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(`Failed to load collections: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // Handle share functionality
  const handleShareCollections = async () => {
    const shareText = "Brooo check this site 💀🔥 HavenDrip got actual student-led fashion drops. Not even on Instagram yet.";
    
    try {
      if (navigator.share) {
        console.log("Web Share API available, attempting to share");
        await navigator.share({
          title: 'Haven Drip Collections',
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

  // Handle share functionality for a specific collection
  const handleShareSpecificCollection = async (e, collection) => {
    e.stopPropagation(); // Prevent navigating to collection page
    
    const shareText = "Brooo check this site 💀🔥 HavenDrip got actual student-led fashion drops. Not even on Instagram yet.";
    const collectionUrl = `${window.location.origin}/collection/${collection.name}`;
    
    try {
      if (navigator.share) {
        console.log("Web Share API available, attempting to share");
        await navigator.share({
          title: `Haven Drip - ${collection.formatted_name} Collection`,
          text: shareText,
          url: collectionUrl,
        });
        console.log('Content shared successfully');
      } else {
        console.log("Web Share API not available, using clipboard fallback");
        // Fallback for browsers that don't support Web Share API
        const shareMessage = `${shareText} ${collectionUrl}`;
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
          const shareMessage = `${shareText} ${collectionUrl}`;
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
      {/* Header with back button */}
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
              Collections
            </h1>
          </div>
          
          {/* Share button */}
          <button
            onClick={handleShareCollections}
            className="p-2 rounded-full bg-[#eaaa07]/10 hover:bg-[#eaaa07]/20 transition-colors"
            aria-label="Share collections"
          >
            <Share2 className="w-5 h-5 text-[#292728]" />
          </button>
        </div>
      </div>

      {/* Haven Drip Promotional Banner */}
      <div className="px-4 py-4">
        <div className="relative overflow-hidden rounded-lg h-28 bg-gradient-to-r from-[#292728] to-[#000] shadow-md">
          {/* Animated diagonal stripes */}
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <div className="absolute inset-0 transform -rotate-45">
              <div className="h-20 w-full bg-white/20 animate-marquee"></div>
              <div className="h-4 w-full bg-transparent"></div>
              <div className="h-2 w-full bg-white/30 animate-marquee"></div>
              <div className="h-1 w-full bg-transparent"></div>
              <div className="h-8 w-full bg-white/10 animate-marquee-reverse"></div>
              <div className="h-6 w-full bg-transparent"></div>
              <div className="h-3 w-full bg-white/20 animate-marquee"></div>
            </div>
          </div>
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center p-4">
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 rounded-full bg-[#eaaa07] flex items-center justify-center mr-2">
                <span className="text-[#292728] text-xs font-bold">H</span>
              </div>
              <h3 className="text-white/90 text-lg font-bold tracking-tight">
                Discover <span className="text-[#eaaa07]">Drip Haven</span>
              </h3>
            </div>
            <p className="text-white/70 text-sm">
              Share any drip collection u like and ur friends like.
              <span className="text-[#eaaa07]"> Put your squad on!</span>
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#eaaa07]/20 to-transparent blur-xl"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#eaaa07]"></div>
          <div className="absolute top-6 right-10 w-1 h-1 rounded-full bg-[#eaaa07]"></div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-2 border-[#eaaa07]/20 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-[#eaaa07] rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-t-2 border-[#eaaa07]/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-4 border-t-2 border-[#eaaa07]/30 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
              </div>
              <p className="text-[#eaaa07] font-medium mt-4">Loading collections</p>
            </div>
          </div>
        )}

        {/* Error State */}
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

        {/* Collections Grid */}
        {!loading && !error && (
          <>
            {collections.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {collections.map((collection, index) => (
                  <motion.div
                    key={collection.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="no-flicker"
                    onClick={() => navigate(`/collection/${collection.name}`)}
                  >
                    <div className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#eaaa07]/10 h-56 group cursor-pointer">
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
                          <div className="absolute inset-0 bg-gradient-to-t from-[#292728]/70 to-transparent/20 group-hover:from-[#292728]/80 transition-all duration-300"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#292728]/5 text-[#292728]/50">
                          <span className="p-2 bg-white/80 rounded-lg">No Image</span>
                        </div>
                      )}
                      
                      {/* Share button in top right corner */}
                      <button
                        onClick={(e) => handleShareSpecificCollection(e, collection)}
                        className="absolute top-2 right-2 z-20 p-2 rounded-full bg-[#292728]/50 backdrop-blur-sm hover:bg-[#292728]/70 transition-all"
                        aria-label="Share collection"
                      >
                        <Share2 className="w-4 h-4 text-white" />
                      </button>
                      
                      {/* Content overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-lg truncate mb-1">
                          {collection.formatted_name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-[#eaaa07] text-xs font-medium bg-[#292728]/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#292728]/5 rounded-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full border border-[#292728]/10 mb-4">
                  <svg className="w-10 h-10 text-[#292728]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <p className="text-[#292728]/70 text-lg font-medium mb-6">No collections found</p>
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

export default CollectionsPage; 