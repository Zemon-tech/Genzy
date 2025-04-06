import { Link } from 'react-router-dom';
import { calculateDiscount } from '../../utils/helpers';
import { motion } from 'framer-motion';
import { useNavigationType } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProductCard = ({ product }) => {
  const navigationType = useNavigationType();
  const isReturningToPage = navigationType === 'POP';

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group block"
    >
      <motion.div 
        whileHover={isReturningToPage ? {} : { y: -5 }}
        whileTap={isReturningToPage ? {} : { scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-xl overflow-hidden bg-white shadow-sm"
      >
        {/* Image Container */}
        <div className="relative aspect-[5/6] overflow-hidden">
          <motion.img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={isReturningToPage ? {} : { scale: 1.1 }}
            transition={{ duration: 0.7 }}
          />
          
          {/* Discount Badge */}
          {calculateDiscount(product.mrp, product.selling_price) > 0 && (
            <div className="absolute bottom-0 right-0 p-1.5">
              <motion.div 
                initial={isReturningToPage ? false : { scale: 0 }}
                animate={isReturningToPage ? false : { scale: 1 }}
                className="bg-black text-white text-[10px] font-medium px-1.5 py-0.5 rounded-lg"
              >
                {calculateDiscount(product.mrp, product.selling_price)}% OFF
              </motion.div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-2 space-y-0.5">
          {/* Brand Name */}
          <p className="text-[10px] font-medium text-gray-500">
            {product.sellers?.brand_name}
          </p>
          
          {/* Product Name */}
          <h3 className="font-medium text-xs text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-bold">
              ₹{product.selling_price}
            </span>
            <span className="text-[10px] text-gray-500 line-through">
              ₹{product.mrp}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string).isRequired,
    mrp: PropTypes.number.isRequired,
    selling_price: PropTypes.number.isRequired
  }).isRequired
};

export default ProductCard; 