import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, ArrowTopRightOnSquareIcon, PencilIcon } from '@heroicons/react/24/outline';
import supabase from '../../config/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

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
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Create New Collection</h2>
        <form onSubmit={handleCreateCollection} className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700">
              Collection Name
            </label>
            <Input
              id="collection-name"
              type="text"
              placeholder="Enter collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use only letters, numbers, hyphens and underscores.
            </p>
          </div>
          <Button type="submit" disabled={creating} className="whitespace-nowrap">
            <PlusIcon className="mr-1 h-5 w-5" />
            {creating ? 'Creating...' : 'Create Collection'}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">All Collections</h2>
        
        {collections.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No collections found. Create your first collection above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {collections.map((collection) => (
              <div 
                key={collection.name} 
                className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                {collection.thumbnail_url && (
                  <div className="mb-3">
                    <img 
                      src={collection.thumbnail_url} 
                      alt={collection.name}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <Link 
                    to={`/admin/collection/${collection.name}`}
                    className="text-blue-600 hover:underline hover:text-blue-800 font-medium flex-1"
                  >
                    {collection.name}
                  </Link>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleEditCollection(collection)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit collection details"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <a
                      href={`/collection/${collection.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View public collection page"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => handleDeleteCollection(collection.name)}
                      className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Delete collection"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {collection.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{collection.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Collection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          
          {editingCollection && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={editingCollection.name}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="banner-url" className="text-right font-medium">
                  Banner URL
                </label>
                <Input
                  id="banner-url"
                  value={editingCollection.banner_url || ''}
                  onChange={(e) => setEditingCollection({
                    ...editingCollection,
                    banner_url: e.target.value
                  })}
                  placeholder="https://example.com/banner.jpg"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="thumbnail-url" className="text-right font-medium">
                  Thumbnail URL
                </label>
                <Input
                  id="thumbnail-url"
                  value={editingCollection.thumbnail_url || ''}
                  onChange={(e) => setEditingCollection({
                    ...editingCollection,
                    thumbnail_url: e.target.value
                  })}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={editingCollection.description || ''}
                  onChange={(e) => setEditingCollection({
                    ...editingCollection,
                    description: e.target.value
                  })}
                  placeholder="Collection description"
                  className="col-span-3"
                  rows={3}
                />
              </div>
              
              {editingCollection.banner_url && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-right font-medium">Banner Preview:</div>
                  <div className="col-span-3">
                    <img 
                      src={editingCollection.banner_url} 
                      alt="Banner preview" 
                      className="w-full h-24 object-cover rounded-md border border-gray-200" 
                    />
                  </div>
                </div>
              )}
              
              {editingCollection.thumbnail_url && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-right font-medium">Thumbnail Preview:</div>
                  <div className="col-span-3">
                    <img 
                      src={editingCollection.thumbnail_url} 
                      alt="Thumbnail preview" 
                      className="w-32 h-32 object-cover rounded-md border border-gray-200" 
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCollection}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 