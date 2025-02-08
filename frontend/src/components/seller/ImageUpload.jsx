import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUpload = ({ images, onUpload, maxImages }) => {
  const onDrop = useCallback(acceptedFiles => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
        } ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>
            Drag & drop images here, or click to select files
            <br />
            <span className="text-sm text-gray-500">
              ({maxImages - images.length} images remaining)
            </span>
          </p>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  const newImages = [...images];
                  newImages.splice(index, 1);
                  onUpload(newImages);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 