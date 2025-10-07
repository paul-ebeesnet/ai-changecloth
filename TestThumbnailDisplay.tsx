import React, { useState, useEffect } from 'react';

const TestThumbnailDisplay: React.FC = () => {
  const [imageStatus, setImageStatus] = useState<string>('Loading...');
  const [showThumbnail, setShowThumbnail] = useState<boolean>(true);
  
  const thumbnailUrl = "https://ebeesnet.com/project/wynn-mif/img/ai-artwork-1759867137807-thumb.png";
  const fullImageUrl = "https://ebeesnet.com/project/wynn-mif/img/ai-artwork-1759867137807.png";
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageStatus('✅ Image loaded successfully');
    };
    img.onerror = () => {
      setImageStatus('❌ Image failed to load');
    };
    img.src = thumbnailUrl;
  }, [thumbnailUrl]);
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a202c', color: 'white', fontFamily: 'Arial, sans-serif' }}>
      <h1>Thumbnail Display Test</h1>
      
      <div style={{ backgroundColor: '#2d3748', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
        <h2>Image Status: {imageStatus}</h2>
        <p>Testing URL: {thumbnailUrl}</p>
        
        <div style={{ position: 'relative', display: 'inline-block', margin: '10px 0' }}>
          {showThumbnail ? (
            <>
              <img 
                src={thumbnailUrl} 
                alt="Test Thumbnail"
                style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                onError={() => console.log('Thumbnail image failed to load')}
                onLoad={() => console.log('Thumbnail image loaded successfully')}
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
            </>
          ) : (
            <img 
              src={fullImageUrl} 
              alt="Full Image"
              style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
            />
          )}
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => setShowThumbnail(!showThumbnail)}
            style={{ 
              backgroundColor: '#4299e1', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Toggle Image Type
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestThumbnailDisplay;