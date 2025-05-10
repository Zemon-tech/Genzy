import { useState } from 'react';
import supabase from '../../config/supabase';

const TestConnection = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testCarouselAccess = async () => {
    setIsLoading(true);
    setStatus(null);
    
    try {
      // First, check if we can select from carousel_slides
      const { error: selectError } = await supabase
        .from('carousel_slides')
        .select('id')
        .limit(1);
        
      if (selectError) {
        setStatus({
          success: false,
          message: `Error reading carousel_slides: ${selectError.message}`,
          details: selectError
        });
        return;
      }
      
      // Try inserting a test record
      const testData = {
        title: 'Test Slide',
        subtitle: 'This is a test',
        image_url: 'https://placehold.co/600x400?text=Test+Slide',
        rank: 999,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('carousel_slides')
        .insert(testData)
        .select();
        
      if (insertError) {
        setStatus({
          success: false,
          message: `Error inserting test record: ${insertError.message}`,
          details: insertError
        });
        return;
      }
      
      // If we successfully inserted, let's delete it to clean up
      if (insertData && insertData.length > 0) {
        const testId = insertData[0].id;
        
        const { error: deleteError } = await supabase
          .from('carousel_slides')
          .delete()
          .eq('id', testId);
          
        if (deleteError) {
          setStatus({
            success: true,
            message: 'Insert successful, but could not delete test record.',
            details: {
              insertSuccess: true,
              deleteError
            }
          });
          return;
        }
        
        // Full success path
        setStatus({
          success: true,
          message: 'Successfully tested full CRUD cycle on carousel_slides table',
          details: {
            insertSuccess: true,
            deleteSuccess: true
          }
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: `Unexpected error during test: ${error.message}`,
        details: error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
      <h3 className="font-medium text-lg mb-4">Connection Test</h3>
      
      <button
        onClick={testCarouselAccess}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-customBlack text-white hover:bg-gray-800'}`}
      >
        {isLoading ? 'Testing...' : 'Test Carousel Permissions'}
      </button>
      
      {status && (
        <div className={`mt-4 p-4 rounded-lg ${status.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`font-medium ${status.success ? 'text-green-700' : 'text-red-700'}`}>
            {status.success ? '✅ ' : '❌ '}{status.message}
          </p>
          {!status.success && (
            <pre className="mt-2 text-xs bg-gray-800 text-white p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(status.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default TestConnection; 