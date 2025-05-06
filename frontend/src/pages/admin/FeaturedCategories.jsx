import { useState, useEffect } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import supabase from '../../config/supabase';

const FeaturedCategories = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featuredCategories, setFeaturedCategories] = useState([]);

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
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...featuredCategories];
    newCategories[index][field] = value;
    newCategories[index].updated_at = new Date().toISOString();
    setFeaturedCategories(newCategories);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newCategories = [...featuredCategories];
    [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      rank: idx + 1,
      updated_at: new Date().toISOString()
    }));
    setFeaturedCategories(updatedCategories);
  };

  const handleMoveDown = (index) => {
    if (index === featuredCategories.length - 1) return;
    const newCategories = [...featuredCategories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      rank: idx + 1,
      updated_at: new Date().toISOString()
    }));
    setFeaturedCategories(updatedCategories);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate all categories have a name and image URL
      const invalidCategories = featuredCategories.filter(cat => !cat.category_name || !cat.image_url);
      if (invalidCategories.length > 0) {
        toast.error('All categories must have a name and image URL');
        return;
      }

      const { error } = await supabase
        .from('featured_categories')
        .upsert(
          featuredCategories.map((cat, index) => ({
            id: cat.id,
            category_name: cat.category_name,
            image_url: cat.image_url,
            rank: index + 1,
            updated_at: new Date().toISOString()
          }))
        );

      if (error) throw error;
      toast.success('Categories updated successfully');
    } catch (error) {
      console.error('Error saving categories:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
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
    <div className="p-4 max-w-[480px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Featured Categories</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-customBlack text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {featuredCategories.map((category, index) => (
          <div key={category.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={category.category_name}
                  onChange={(e) => handleCategoryChange(index, 'category_name', e.target.value)}
                  placeholder="Category Name"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={category.image_url}
                  onChange={(e) => handleCategoryChange(index, 'image_url', e.target.value)}
                  placeholder="Image URL"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ArrowUpIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === featuredCategories.length - 1}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ArrowDownIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {category.image_url && (
              <div className="mt-2">
                <img
                  src={category.image_url}
                  alt={category.category_name}
                  className="h-20 w-32 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/128x80?text=Invalid+URL';
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCategories; 