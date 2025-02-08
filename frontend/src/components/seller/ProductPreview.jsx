const ProductPreview = ({ product }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Product Preview</h2>
      
      {product.images.length > 0 ? (
        <img
          src={URL.createObjectURL(product.images[0])}
          alt={product.name}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-400">
          No image
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-medium">{product.name || 'Product Name'}</h3>
        
        {product.selling_price && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">₹{product.selling_price}</span>
            {product.mrp && product.mrp > product.selling_price && (
              <>
                <span className="text-sm text-gray-500 line-through">₹{product.mrp}</span>
                <span className="text-sm text-green-600">
                  {Math.round((1 - product.selling_price / product.mrp) * 100)}% off
                </span>
              </>
            )}
          </div>
        )}

        {product.sizes.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Sizes: </span>
            {product.sizes.join(', ')}
          </div>
        )}

        {product.colors.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Colors: </span>
            {product.colors.join(', ')}
          </div>
        )}

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductPreview; 