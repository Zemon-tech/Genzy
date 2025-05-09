import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDescription = ({ product, isChartOpen, setIsChartOpen }) => {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'shipping', label: 'Shipping & Returns' },
    { id: 'seller', label: 'Seller Info' },
  ];

  return (
    <div className="mt-16 bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-gray-600">{product.description}</p>
                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="list-disc pl-5 text-gray-600">
                    <li>Style Type: {product.style_type}</li>
                    <li>Available Colors: {product.colors.join(', ')}</li>
                    <li>Available Sizes: {product.sizes.join(', ')}</li>
                  </ul>
                </div>
                <button
                  onClick={() => setIsChartOpen(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Size Chart
                </button>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Shipping Information:</h4>
                  <p className="text-gray-600">
                    Estimated Delivery: {product.estimated_delivery}
                    <br />
                    Shipping Charges: ₹{product.shipping_charges}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Return Policy:</h4>
                  <p className="text-gray-600">{product.return_policy}</p>
                </div>
              </div>
            )}

            {activeTab === 'seller' && (
              <div className="space-y-4">
                <h4 className="font-medium">Seller Information:</h4>
                <div className="text-gray-600">
                  <p>Brand: {product.sellers.brand_name}</p>
                  <p>Email: {product.sellers.business_email}</p>
                  <p>Contact: {product.sellers.phone_number}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {isChartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsChartOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-5 w-full max-w-[90%] sm:max-w-[420px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Size Chart</h3>
                <button 
                  onClick={() => setIsChartOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Size Chart Images */}
              <div className="overflow-y-auto max-h-[70vh]">
                {product.size_chart ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img 
                        src={product.size_chart} 
                        alt="Product Size Chart" 
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product.sellers?.size_chart_image1_url || 
                     product.sellers?.size_chart_image2_url || 
                     product.sellers?.size_chart_image3_url ? (
                      <div className="space-y-4">
                        {product.sellers.size_chart_image1_url && (
                          <div className="flex justify-center">
                            <img 
                              src={product.sellers.size_chart_image1_url} 
                              alt="Size Chart 1" 
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {product.sellers.size_chart_image2_url && (
                          <div className="flex justify-center mt-4">
                            <img 
                              src={product.sellers.size_chart_image2_url} 
                              alt="Size Chart 2" 
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {product.sellers.size_chart_image3_url && (
                          <div className="flex justify-center mt-4">
                            <img 
                              src={product.sellers.size_chart_image3_url} 
                              alt="Size Chart 3" 
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No size chart available for this product.</p>
                        <p className="text-sm text-gray-400 mt-2">Please contact the seller for sizing information.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDescription; 