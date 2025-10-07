import React, { useState, useEffect } from 'react';

const MinimalThumbnailTest: React.FC = () => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  
  const thumbnailUrl = "https://ebeesnet.com/project/wynn-mif/img/ai-artwork-1759867540763-thumb.png";
  
  useEffect(() => {
    console.log('Component mounted, testing image URL:', thumbnailUrl);
  }, []);
  
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoaded(true);
    setImageError(false);
    const img = e.target as HTMLImageElement;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    console.log('✅ Image loaded successfully:', {
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoaded(false);
    setImageError(true);
    console.log('❌ Image failed to load:', e);
    const img = e.target as HTMLImageElement;
    console.log('Image element state:', {
      src: img.src,
      complete: img.complete
    });
  };
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', color: 'white', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minimal Thumbnail Test</h1>
      
      <div style={{ backgroundColor: '#2d3748', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>Testing Thumbnail Display</h2>
        <p>URL: {thumbnailUrl}</p>
        
        <div style={{ 
          position: 'relative', 
          display: 'inline-block', 
          margin: '10px 0',
          border: imageError ? '2px solid red' : imageLoaded ? '2px solid green' : '2px solid gray'
        }}>
          <img 
            src={thumbnailUrl} 
            alt="Test Thumbnail"
            style={{ 
              maxWidth: '100%', 
              borderRadius: '8px', 
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'block'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: '8px', 
            right: '8px', 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px' 
          }}>
            縮圖預覽
          </div>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          {imageLoaded && (
            <p style={{ color: 'green' }}>
              ✅ Image loaded successfully
              {imageDimensions && ` (${imageDimensions.width} x ${imageDimensions.height})`}
            </p>
          )}
          {imageError && (
            <p style={{ color: 'red' }}>
              ❌ Image failed to load
            </p>
          )}
          {!imageLoaded && !imageError && (
            <p style={{ color: 'gray' }}>
              ⏳ Loading image...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalThumbnailTest;