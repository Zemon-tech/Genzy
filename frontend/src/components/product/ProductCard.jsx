import { Link } from 'react-router-dom';
import { calculateDiscount } from '../../utils/helpers';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  return (
    <Link 
      to={`/product/${product.id}`}
      className="group block"
    >
      {/* Card Container with Glassmorphism */}
      <motion.div 
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
          
          {/* Discount Badge with Gradient */}
          {calculateDiscount(product.mrp, product.selling_price) > 0 && (
            <div className="absolute top-3 right-3 backdrop-blur-md">
              <div className="relative px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-full shadow-lg">
                <span className="relative text-xs font-bold text-white tracking-wider">
                  {calculateDiscount(product.mrp, product.selling_price)}% OFF
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Product Info with Glassmorphism */}
        <div className="p-4 backdrop-blur-md bg-white/80">
          {/* Brand Name */}
          <p className="text-xs font-medium text-gray-500 tracking-wider uppercase mb-1">
            {product.sellers?.brand_name || 'Brand Name'}
          </p>
          
          {/* Product Name */}
          <h3 className="font-medium text-gray-900 tracking-tight truncate mb-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              ₹{product.selling_price}
            </span>
            <span className="text-sm text-gray-500 line-through">
              ₹{product.mrp}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard; 