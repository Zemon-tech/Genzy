import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, PencilIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../config/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { GradientButton } from '../ui/gradient-button';

export default function CollectionList() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      // Get collections from the collections table
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .order('name');
        
      if (collectionsError) throw collectionsError;

      if (collectionsData?.length) {
        setCollections(collectionsData);
      } else {
        // Fallback to getting collections from products if no collections table data
        const { data, error } = await supabase
          .rpc('get_unique_collections');

        if (error) throw error;
        
        // Process collections from products and ensure they exist in collections table
        const collectionNames = (data || []).map(item => item.collection_name);
        
        if (collectionNames.length > 0) {
          // Create entries in collections table for these collections
          const insertPromises = collectionNames.map(name => 
            supabase
              .from('collections')
              .insert([{ 
                name, 
                banner_url: '', 
                thumbnail_url: '', 
                description: '' 
              }])
              .onConflict('name')
              .ignore()
          );
          
          await Promise.all(insertPromises);
          
          // Fetch again after inserting
          const { data: updatedData } = await supabase
            .from('collections')
            .select('*')
            .order('name');
            
          setCollections(updatedData || []);
        } else {
          setCollections([]);
        }
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }
    
    // Validate name - only allow letters, numbers, hyphens and underscores
    if (!/^[a-zA-Z0-9-_]+$/.test(newCollectionName)) {
      toast.error('Collection name must contain only letters, numbers, hyphens and underscores');
      return;
    }
    
    setCreating(true);
    try {
      // Check if collection already exists in local state
      const existingCollection = collections.find(c => c.name === newCollectionName);
      
      if (existingCollection) {
        toast.success(`Collection "${newCollectionName}" already exists`);
        setNewCollectionName('');
        window.location.href = `/admin/collection/${newCollectionName}`;
        return;
      }
      
      // Create collection entry in collections table
      const { data, error } = await supabase
        .from('collections')
        .insert([{ 
          name: newCollectionName,
          banner_url: '',
          thumbnail_url: '',
          description: ''
        }])
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.success(`Collection "${newCollectionName}" already exists`);
          setNewCollectionName('');
          window.location.href = `/admin/collection/${newCollectionName}`;
          return;
        }
        throw error;
      }
      
      toast.success(`Collection "${newCollectionName}" created`);
      setNewCollectionName('');
      
      // Add to local state
      setCollections([...collections, data]);
      
      // Redirect to collection page
      window.location.href = `/admin/collection/${newCollectionName}`;
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (collectionName) => {
    if (!confirm(`Are you sure you want to delete the "${collectionName}" collection? This will remove all products from this collection but won't delete the products themselves.`)) {
      return;
    }
    
    try {
      // Remove collection from collections table
      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .eq('name', collectionName);
        
      if (deleteError) console.error('Error deleting from collections table:', deleteError);
      
      // Remove this collection from all products that have it
      const { error } = await supabase
        .rpc('remove_collection_from_products', { collection_name: collectionName });
        
      if (error) throw error;
      
      toast.success(`Collection "${collectionName}" deleted`);
      
      // Update local state
      setCollections(collections.filter(c => c.name !== collectionName));
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleEditCollection = (collection) => {
    setEditingCollection({...collection});
    setIsDialogOpen(true);
  };

  const handleSaveCollection = async () => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({
          banner_url: editingCollection.banner_url,
          thumbnail_url: editingCollection.thumbnail_url,
          description: editingCollection.description
        })
        .eq('name', editingCollection.name);
        
      if (error) throw error;
      
      toast.success(`Collection "${editingCollection.name}" updated`);
      
      // Update local state
      setCollections(collections.map(c => 
        c.name === editingCollection.name ? editingCollection : c
      ));
      
      setIsDialogOpen(false);
      setEditingCollection(null);
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-purple-600 animate-pulse">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Create New Collection</h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleCreateCollection} className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1 w-full">
              <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name
              </label>
              <Input
                id="collection-name"
                type="text"
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-lg shadow-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use only letters, numbers, hyphens and underscores.
              </p>
            </div>
            <GradientButton type="submit" disabled={creating} className="whitespace-nowrap">
              <PlusIcon className="mr-1 h-5 w-5" />
              {creating ? 'Creating...' : 'Create Collection'}
            </GradientButton>
          </form>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">All Collections</h2>
        </div>
        
        <div className="p-6">
          {collections.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <p className="text-gray-500 mb-4">
                No collections found. Create your first collection above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {collections.map((collection, index) => (
                  <motion.div
                    key={collection.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group bg-white border border-gray-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    {collection.thumbnail_url ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={collection.thumbnail_url}
                          alt={collection.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    )}
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold mb-2">
                        {collection.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </h3>
                      
                      {collection.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{collection.description}</p>
                      )}
                      
                      <div className="flex items-center mt-auto pt-4 justify-between">
                        <Link
                          to={`/admin/collection/${collection.name}`}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Manage Products
                          <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                        </Link>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditCollection(collection)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit Collection"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCollection(collection.name)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Collection"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <Link 
                      to={`/collection/${collection.name}`} 
                      className="block bg-gray-50 hover:bg-gray-100 transition-colors p-2 text-xs text-center text-gray-500 border-t border-gray-100"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Public Page
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Collection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          
          {editingCollection && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name
                </label>
                <Input
                  value={editingCollection.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner URL
                </label>
                <Input
                  value={editingCollection.banner_url}
                  onChange={(e) => setEditingCollection({...editingCollection, banner_url: e.target.value})}
                  placeholder="Enter banner image URL"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Image shown at the top of the collection page
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <Input
                  value={editingCollection.thumbnail_url}
                  onChange={(e) => setEditingCollection({...editingCollection, thumbnail_url: e.target.value})}
                  placeholder="Enter thumbnail image URL"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Small preview image shown in collection listings
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={editingCollection.description}
                  onChange={(e) => setEditingCollection({...editingCollection, description: e.target.value})}
                  placeholder="Enter collection description"
                  rows={3}
                />
              </div>
              
              {editingCollection.thumbnail_url && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <img
                    src={editingCollection.thumbnail_url}
                    alt="Thumbnail preview"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCollection}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 