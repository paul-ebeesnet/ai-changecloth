// Image fetch test to check for CORS or other issues
console.log('=== Image Fetch Test ===');

const thumbnailUrl = 'https://ebeesnet.com/project/wynn-mif/img/ai-artwork-1759867540763-thumb.png';

console.log('Testing URL:', thumbnailUrl);

// Test 1: Simple fetch
fetch(thumbnailUrl)
    .then(response => {
        console.log('Fetch response status:', response.status);
        console.log('Fetch response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            console.log('✅ Fetch successful');
            return response.blob();
        } else {
            console.log('❌ Fetch failed with status:', response.status);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    })
    .then(blob => {
        console.log('Blob received:', {
            size: blob.size,
            type: blob.type
        });
        
        // Create object URL
        const objectUrl = URL.createObjectURL(blob);
        console.log('Object URL created:', objectUrl);
        
        // Try to load image from object URL
        const img = new Image();
        img.onload = function() {
            console.log('✅ Image loaded from blob:', {
                width: this.naturalWidth,
                height: this.naturalHeight
            });
            URL.revokeObjectURL(objectUrl);
        };
        img.onerror = function(e) {
            console.log('❌ Image failed to load from blob:', e);
            URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
    })
    .catch(error => {
        console.log('❌ Fetch error:', error);
    });

// Test 2: Fetch with credentials
fetch(thumbnailUrl, { credentials: 'include' })
    .then(response => {
        console.log('Fetch with credentials status:', response.status);
    })
    .catch(error => {
        console.log('Fetch with credentials error:', error);
    });

// Test 3: Fetch with mode
fetch(thumbnailUrl, { mode: 'cors' })
    .then(response => {
        console.log('Fetch with CORS mode status:', response.status);
    })
    .catch(error => {
        console.log('Fetch with CORS mode error:', error);
    });

console.log('=== End of Image Fetch Test ===');