import { useState } from 'react';
import PropTypes from 'prop-types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';
import { Button } from '../ui/button';

export default function ProductCard({ product, collectionName, onRemoved, onEdit }) {
  const [removing, setRemoving] = useState(false);

  // Format price to currency
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleRemoveFromCollection = async () => {
    if (!confirm(`Are you sure you want to remove "${product.name}" from the ${collectionName} collection?`)) {
      return;
    }
    
    setRemoving(true);
    try {
      // Get current collections and remove this one
      const collections = [...(product.collections || [])];
      const updatedCollections = collections.filter(c => c !== collectionName);
      
      // Update product
      const { error } = await supabase
        .from('products')
        .update({ collections: updatedCollections })
        .eq('id', product.id);
        
      if (error) throw error;
      
      toast.success('Product removed from collection');
      
      // Notify parent component
      if (onRemoved) {
        onRemoved(product.id);
      }
    } catch (error) {
      console.error('Error removing product from collection:', error);
      toast.error('Failed to remove product from collection');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.images && product.images[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x300?text=No+Image';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>
      
      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-md font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2" title={product.description}>
          {product.description || 'No description'}
        </p>
        
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Category:</span> {product.category || 'N/A'}
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {formatPrice(product.selling_price)}
              </p>
              {product.mrp && product.mrp !== product.selling_price && (
                <p className="text-sm text-gray-500 line-through">
                  {formatPrice(product.mrp)}
                </p>
              )}
            </div>
            {product.stock_quantity !== undefined && (
              <div className="text-sm text-gray-600">
                Stock: {product.stock_quantity}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit && onEdit(product)}
              className="flex-1 mr-2"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFromCollection}
              disabled={removing}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  onRemoved: PropTypes.func,
  onEdit: PropTypes.func
}; 