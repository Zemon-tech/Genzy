import { Link } from 'react-router-dom';
import { calculateDiscount } from '../../utils/helpers';

const ProductCard = ({ product }) => {
  return (
    <Link 
      to={`/product/${product.id}`}
      className="group relative block"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white text-black text-sm font-medium px-4 py-2 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
            Quick View
          </span>
        </div>

        {/* Discount Badge */}
        {calculateDiscount(product.mrp, product.selling_price) > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1">
            {calculateDiscount(product.mrp, product.selling_price)}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-3 px-2">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold">₹{product.selling_price}</span>
          <span className="text-xs text-gray-500 line-through">₹{product.mrp}</span>
        </div>
        
        {/* Size Options */}
        <div className="mt-2 flex gap-1">
          {product.sizes.map(size => (
            <span key={size} className="text-xs border px-1.5 py-0.5 text-gray-600">
              {size}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard; 