import { useState } from 'react';
import { motion } from 'framer-motion';

const ProductImages = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <motion.img
          src={selectedImage}
          alt="Product"
          className="w-full h-full object-cover cursor-zoom-in"
          animate={{
            scale: isZoomed ? 1.5 : 1
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Thumbnail Images */}
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className={`aspect-square rounded-md overflow-hidden ${
              selectedImage === image ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            <img
              src={image}
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImages; 