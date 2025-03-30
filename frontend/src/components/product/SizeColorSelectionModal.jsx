import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SizeColorSelectionModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onConfirm
}) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const handleSubmit = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select both size and color', {
        position: 'top-center',
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          padding: '16px'
        }
      });
      return;
    }

    onConfirm({
      size: selectedSize,
      color: selectedColor
    });
    
    // Reset and close
    setSelectedSize('');
    setSelectedColor('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-lg p-5 w-full max-w-[90%] sm:max-w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Select Options</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-5">
          <p className="text-sm text-gray-600 mb-1">
            Please select size and color to add to cart:
          </p>
          <div className="font-medium truncate">{product.name}</div>
        </div>
        
        {/* Sizes */}
        <div className="mb-5">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Select Size</h3>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-3 text-sm font-medium border rounded-md transition-colors
                  ${selectedSize === size
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-gray-900'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Select Color</h3>
          <div className="flex gap-3">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-full border-2 transition-all
                  ${selectedColor === color 
                    ? 'border-black scale-110' 
                    : 'border-transparent hover:scale-110'
                  }`}
              >
                <span
                  className="block w-full h-full rounded-full"
                  style={{ backgroundColor: color.toLowerCase() }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SizeColorSelectionModal; 