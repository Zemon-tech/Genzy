import { useState, useEffect } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  PlusIcon,
  XMarkIcon,
  LinkIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';

const FeaturedCategories = () => {
  const [activeTab, setActiveTab] = useState('carousel'); // 'carousel' or 'categories'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get featured categories
        const { data: featuredData, error: featuredError } = await supabase
          .from('featured_categories')
          .select('*')
          .order('rank', { ascending: true });

        if (featuredError) {
          console.error('Error fetching featured categories:', featuredError);
          toast.error('Failed to load featured categories');
        } else {
          setFeaturedCategories(featuredData || []);
        }

        // Get carousel slides
        const { data: slidesData, error: slidesError } = await supabase
          .from('carousel_slides')
          .select('*')
          .order('rank', { ascending: true });

        if (slidesError) {
          console.error('Error fetching carousel slides:', slidesError);
          toast.error('Failed to load carousel slides');
        } else {
          setCarouselSlides(slidesData || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ==== Categories management functions ====
  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...featuredCategories];
    newCategories[index][field] = value;
    newCategories[index].updated_at = new Date().toISOString();
    
    // If changing category_name for a regular category, auto-generate a link_url if one doesn't exist
    if (field === 'category_name' && newCategories[index].type === 'category' && !newCategories[index].link_url) {
      const categorySlug = value.toLowerCase().replace(/\s+/g, '-');
      newCategories[index].link_url = `/category/${categorySlug}`;
    }
    
    // If changing type to 'category' and no link_url exists, generate one from the name
    if (field === 'type' && value === 'category' && !newCategories[index].link_url && newCategories[index].category_name) {
      const categorySlug = newCategories[index].category_name.toLowerCase().replace(/\s+/g, '-');
      newCategories[index].link_url = `/category/${categorySlug}`;
    }
    
    setFeaturedCategories(newCategories);
  };

  const handleAddCategory = () => {
    const newRank = featuredCategories.length > 0 
      ? Math.max(...featuredCategories.map(c => c.rank)) + 1 
      : 1;
    
    const newCategory = {
      id: `temp_${Date.now()}`, // Temporary ID until saved
      category_name: '',
      description: '',
      image_url: '',
      link_url: '',
      type: 'category',
      rank: newRank,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setFeaturedCategories([...featuredCategories, newCategory]);
  };

  const handleDeleteCategory = (index) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
    const newCategories = [...featuredCategories];
      const deletedCategory = newCategories.splice(index, 1)[0];
      
      // If the item has a real ID (not temporary), schedule it for deletion
      if (deletedCategory.id && !deletedCategory.id.toString().startsWith('temp_')) {
        // Here you would typically add to a deletion queue or directly delete from DB
        // For simplicity, we'll delete immediately
        supabase
          .from('featured_categories')
          .delete()
          .eq('id', deletedCategory.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error deleting category:', error);
              toast.error('Failed to delete category');
            } else {
              toast.success('Category deleted');
            }
          });
      }
      
      // Update ranks for remaining items
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      rank: idx + 1,
      updated_at: new Date().toISOString()
    }));
      
    setFeaturedCategories(updatedCategories);
    }
  };

  const handleMoveCategory = (index, direction) => {
    if (
      (direction === -1 && index === 0) || 
      (direction === 1 && index === featuredCategories.length - 1)
    ) return;
    
    const newIndex = index + direction;
    const newCategories = [...featuredCategories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      rank: idx + 1,
      updated_at: new Date().toISOString()
    }));
    
    setFeaturedCategories(updatedCategories);
  };

  const saveCategories = async () => {
    setSaving(true);
    try {
      // Validate all categories have a name and image URL
      const invalidCategories = featuredCategories.filter(cat => !cat.category_name || !cat.image_url);
      if (invalidCategories.length > 0) {
        toast.error('All categories must have a name and image URL');
        return;
      }

      // Process categories one by one to avoid permission issues
      for (const category of featuredCategories) {
        // Check if it's a new category or existing one
        const isNew = category.id.toString().startsWith('temp_');
        
        if (isNew) {
          // For new categories, create a clean object without the temporary ID
          const categoryData = { ...category };
          delete categoryData.id;
          const { error } = await supabase
            .from('featured_categories')
            .insert(categoryData);
            
          if (error) {
            console.error('Error inserting category:', error);
            throw error;
          }
        } else {
          // For existing categories, update
      const { error } = await supabase
            .from('featured_categories')
            .update({
              category_name: category.category_name,
              description: category.description,
              image_url: category.image_url,
              link_url: category.link_url,
              type: category.type,
              rank: category.rank,
              updated_at: new Date().toISOString()
            })
            .eq('id', category.id);
            
          if (error) {
            console.error('Error updating category:', error);
            throw error;
          }
        }
      }
      
      // Check for categories to delete (categories that were in DB but removed from state)
      const { data: existingCategories, error: fetchError } = await supabase
        .from('featured_categories')
        .select('id');
        
      if (fetchError) {
        console.error('Error fetching existing categories:', fetchError);
      } else {
        // Get IDs of current categories in state (excluding new ones with temp IDs)
        const currentIds = featuredCategories
          .filter(cat => !cat.id.toString().startsWith('temp_'))
          .map(cat => cat.id);
          
        // Find categories to delete
        for (const dbCategory of existingCategories) {
          if (!currentIds.includes(dbCategory.id)) {
            // This category exists in DB but not in our state, so delete it
            const { error: deleteError } = await supabase
              .from('featured_categories')
              .delete()
              .eq('id', dbCategory.id);
              
            if (deleteError) {
              console.error('Error deleting category:', deleteError);
            }
          }
        }
      }
      
      // Refresh data to get new real IDs
      const { data: refreshedData, error: refreshError } = await supabase
        .from('featured_categories')
        .select('*')
        .order('rank', { ascending: true });
        
      if (refreshError) {
        console.error('Error refreshing categories data:', refreshError);
      } else {
        setFeaturedCategories(refreshedData);
      }
      
      toast.success('Categories updated successfully');
    } catch (error) {
      console.error('Error saving categories:', error);
      toast.error(`Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // ==== Carousel slides management functions ====
  const handleSlideChange = (index, field, value) => {
    const newSlides = [...carouselSlides];
    newSlides[index][field] = value;
    newSlides[index].updated_at = new Date().toISOString();
    setCarouselSlides(newSlides);
  };

  const handleAddSlide = () => {
    const newRank = carouselSlides.length > 0 
      ? Math.max(...carouselSlides.map(s => s.rank)) + 1 
      : 1;
    
    const newSlide = {
      id: `temp_${Date.now()}`, // Temporary ID until saved
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      link_text: '',
      rank: newRank,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCarouselSlides([...carouselSlides, newSlide]);
  };

  const handleDeleteSlide = (index) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      const newSlides = [...carouselSlides];
      const deletedSlide = newSlides.splice(index, 1)[0];
      
      // If the item has a real ID (not temporary), schedule it for deletion
      if (deletedSlide.id && !deletedSlide.id.toString().startsWith('temp_')) {
        supabase
          .from('carousel_slides')
          .delete()
          .eq('id', deletedSlide.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error deleting slide:', error);
              toast.error('Failed to delete slide');
            } else {
              toast.success('Slide deleted');
            }
          });
      }
      
      // Update ranks for remaining items
      const updatedSlides = newSlides.map((slide, idx) => ({
        ...slide,
        rank: idx + 1,
        updated_at: new Date().toISOString()
      }));
      
      setCarouselSlides(updatedSlides);
    }
  };

  const handleMoveSlide = (index, direction) => {
    if (
      (direction === -1 && index === 0) || 
      (direction === 1 && index === carouselSlides.length - 1)
    ) return;
    
    const newIndex = index + direction;
    const newSlides = [...carouselSlides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    
    const updatedSlides = newSlides.map((slide, idx) => ({
      ...slide,
      rank: idx + 1,
      updated_at: new Date().toISOString()
    }));
    
    setCarouselSlides(updatedSlides);
  };

  const saveCarouselSlides = async () => {
    setSaving(true);
    try {
      // Validate all slides have a title and image URL
      const invalidSlides = carouselSlides.filter(slide => !slide.title || !slide.image_url);
      if (invalidSlides.length > 0) {
        toast.error('All slides must have a title and image URL');
        return;
      }

      // Process slides one by one to avoid permission issues
      for (const slide of carouselSlides) {
        // Check if it's a new slide or existing one
        const isNew = slide.id.toString().startsWith('temp_');
        
        if (isNew) {
          // For new slides, create a clean object without the temporary ID
          const slideData = { ...slide };
          delete slideData.id;
          const { error } = await supabase
            .from('carousel_slides')
            .insert(slideData);
            
          if (error) {
            console.error('Error inserting slide:', error);
            throw error;
          }
        } else {
          // For existing slides, update
          const { error } = await supabase
            .from('carousel_slides')
            .update({
              title: slide.title,
              subtitle: slide.subtitle,
              image_url: slide.image_url,
              link_url: slide.link_url,
              link_text: slide.link_text,
              rank: slide.rank,
              updated_at: new Date().toISOString()
            })
            .eq('id', slide.id);
            
          if (error) {
            console.error('Error updating slide:', error);
            throw error;
          }
        }
      }
      
      // Check for slides to delete (slides that were in DB but removed from state)
      const { data: existingSlides, error: fetchError } = await supabase
        .from('carousel_slides')
        .select('id');
        
      if (fetchError) {
        console.error('Error fetching existing slides:', fetchError);
      } else {
        // Get IDs of current slides in state (excluding new ones with temp IDs)
        const currentIds = carouselSlides
          .filter(slide => !slide.id.toString().startsWith('temp_'))
          .map(slide => slide.id);
          
        // Find slides to delete
        for (const dbSlide of existingSlides) {
          if (!currentIds.includes(dbSlide.id)) {
            // This slide exists in DB but not in our state, so delete it
            const { error: deleteError } = await supabase
              .from('carousel_slides')
              .delete()
              .eq('id', dbSlide.id);
              
            if (deleteError) {
              console.error('Error deleting slide:', deleteError);
            }
          }
        }
      }
      
      // Refresh data to get new real IDs
      const { data: refreshedData, error: refreshError } = await supabase
        .from('carousel_slides')
        .select('*')
        .order('rank', { ascending: true });
        
      if (refreshError) {
        console.error('Error refreshing slides data:', refreshError);
      } else {
        setCarouselSlides(refreshedData);
      }
      
      toast.success('Carousel slides updated successfully');
    } catch (error) {
      console.error('Error saving carousel slides:', error);
      toast.error(`Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 'carousel') {
      saveCarouselSlides();
    } else {
      saveCategories();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-customBlack">Content Management</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-customBlack text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('carousel')}
          className={`py-3 px-6 font-medium transition-colors ${
            activeTab === 'carousel'
              ? 'border-b-2 border-customBlack text-customBlack'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Carousel Slides
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-6 font-medium transition-colors ${
            activeTab === 'categories'
              ? 'border-b-2 border-customBlack text-customBlack'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Featured Categories
        </button>
      </div>

      {/* Carousel Slides Management */}
      {activeTab === 'carousel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {carouselSlides.map((slide, index) => (
              <div key={slide.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-800 font-medium text-xs py-1 px-2 rounded-full">#{index + 1}</span>
                    <h3 className="font-medium text-gray-800 ml-2">{slide.title || 'Untitled Slide'}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveSlide(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 text-gray-600"
                      title="Move up"
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(index, 1)}
                      disabled={index === carouselSlides.length - 1}
                      className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 text-gray-600"
                      title="Move down"
                    >
                      <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      title="Delete slide"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Preview Image */}
                  {slide.image_url ? (
                    <div className="relative h-40 rounded-lg overflow-hidden group cursor-pointer">
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/EEEEEE/999999?text=Invalid+URL';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex flex-col items-center justify-end p-3">
                        {slide.link_url && slide.link_text && (
                          <button className="mb-2 px-3 py-1 bg-white text-black text-xs rounded-full">
                            {slide.link_text}
                          </button>
                        )}
                        <h4 className="font-bold text-sm text-white">{slide.title}</h4>
                        {slide.subtitle && <p className="text-xs text-white opacity-90">{slide.subtitle}</p>}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <EyeIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200">
                      <div className="text-center text-gray-400">
                        <PhotoIcon className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">No image set</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slide.title || ''}
                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                        placeholder="Slide Title"
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={slide.subtitle || ''}
                        onChange={(e) => handleSlideChange(index, 'subtitle', e.target.value)}
                        placeholder="Slide Subtitle"
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slide.image_url || ''}
                        onChange={(e) => handleSlideChange(index, 'image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <details className="group">
                        <summary className="flex items-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Link Settings (Optional)
                          <span className="ml-auto transition group-open:rotate-180">
                            <svg fill="none" height="24" width="24" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M6 9l6 6 6-6"></path>
                            </svg>
                          </span>
                        </summary>
                        <div className="space-y-3 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Link URL
                            </label>
                            <input
                              type="text"
                              value={slide.link_url || ''}
                              onChange={(e) => handleSlideChange(index, 'link_url', e.target.value)}
                              placeholder="e.g., /products/sale"
                              className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Link Text
                            </label>
                            <input
                              type="text"
                              value={slide.link_text || ''}
                              onChange={(e) => handleSlideChange(index, 'link_text', e.target.value)}
                              placeholder="e.g., Shop Now"
                              className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                            />
                            {slide.link_url && !slide.link_text && (
                              <p className="text-amber-600 text-xs flex items-center mt-1">
                                <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                                Link URL is set but no button text. The button won&apos;t be displayed.
                              </p>
                            )}
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {carouselSlides.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">No carousel slides yet. Add some!</p>
            </div>
          )}

          <button
            onClick={handleAddSlide}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Carousel Slide
          </button>
        </div>
      )}

      {/* Featured Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredCategories.map((category, index) => (
              <div 
                key={category.id} 
                className={`bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
                  category.type === 'promo' ? 'border-l-4 border-amber-400' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <span className="bg-gray-100 text-gray-800 font-medium text-xs py-1 px-2 rounded-full">#{index + 1}</span>
                    <h3 className="font-medium text-gray-800 ml-2">
                      {category.type === 'promo' ? '🔥 Promo' : 'Category'}: {category.category_name || 'Untitled'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveCategory(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 text-gray-600"
                      title="Move up"
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(index, 1)}
                      disabled={index === featuredCategories.length - 1}
                      className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 text-gray-600"
                      title="Move down"
                    >
                      <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      title="Delete category"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Preview Column */}
                  <div className="col-span-1">
                    {category.image_url ? (
                      <div className="relative rounded-lg overflow-hidden h-full min-h-[140px] group cursor-pointer">
                        <img
                          src={category.image_url}
                          alt={category.category_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/300x400/EEEEEE/999999?text=Invalid+URL';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 flex flex-col items-center justify-end p-2">
                          <h4 className="font-bold text-xs text-white text-center">{category.category_name}</h4>
                          {category.description && category.type === 'promo' && (
                            <p className="text-xs text-white opacity-90 text-center">{category.description}</p>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <EyeIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-full min-h-[140px] rounded-lg flex items-center justify-center bg-gray-100 border border-gray-200">
                        <div className="text-center text-gray-400">
                          <PhotoIcon className="w-8 h-8 mx-auto mb-1" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Form Fields Column */}
                  <div className="col-span-2 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={category.category_name || ''}
                        onChange={(e) => handleCategoryChange(index, 'category_name', e.target.value)}
                        placeholder="Category Name"
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={category.type || 'category'}
                        onChange={(e) => handleCategoryChange(index, 'type', e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      >
                        <option value="category">Regular Category</option>
                        <option value="promo">Promotional Banner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={category.image_url || ''}
                        onChange={(e) => handleCategoryChange(index, 'image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description {category.type === 'promo' ? <span className="text-red-500">*</span> : '(optional)'}
                      </label>
                      <input
                        type="text"
                        value={category.description || ''}
                        onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                        placeholder={category.type === 'promo' ? 'Short promotional text' : 'Optional description'}
                        className="w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link URL {category.type === 'promo' ? <span className="text-red-500">*</span> : ''}
                      </label>
                      <div className="relative">
                        {category.type === 'category' && (
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 text-sm">
                            /category/
                          </div>
                        )}
                        <input
                          type="text"
                          value={category.link_url || ''}
                          onChange={(e) => handleCategoryChange(index, 'link_url', e.target.value)}
                          placeholder={category.type === 'promo' ? 'e.g., /products/sale' : 'Auto-generated from name (can edit)'}
                          className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-gray-300 focus:border-gray-300 outline-none transition-colors ${category.type === 'category' ? 'pl-[calc(0.75rem+70px)]' : ''}`}
                        />
                      </div>
                      {category.type === 'promo' && !category.link_url && (
                        <p className="text-amber-600 text-xs flex items-center mt-1">
                          <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                          Link URL is required for promotional banners
                        </p>
                      )}
                      {category.type === 'category' && !category.link_url && category.category_name && (
                        <p className="text-gray-500 text-xs mt-1">
                          Will auto-generate URL from category name on save
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {featuredCategories.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">No featured categories yet. Add some!</p>
            </div>
          )}

          <button
            onClick={handleAddCategory}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Featured Category
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedCategories; 