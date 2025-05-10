import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import supabase from '../../config/supabase';

const CollectionPage = () => {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collection, setCollection] = useState(null);
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

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto">
      {/* Header with back button */}
      <div className="flex items-center p-4">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{collectionName} Collection</h1>
      </div>

      {/* Collection Banner */}
      {collection?.banner_url && (
        <div className="w-full mb-4">
          <img 
            src={collection.banner_url} 
            alt={`${collectionName} banner`} 
            className="w-full h-40 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Collection Description */}
      {collection?.description && (
        <div className="px-4 mb-6">
          <p className="text-gray-700">{collection.description}</p>
        </div>
      )}

      <div className="p-4">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            {Array.isArray(products) && products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this collection</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 px-4 py-2 bg-black text-white rounded-full text-sm"
                >
                  Back to Home
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CollectionPage; 