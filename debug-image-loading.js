// Debug script to test image loading issues
console.log('=== Image Loading Debug Script ===');

// Test the specific thumbnail URL
const thumbnailUrl = 'https://ebeesnet.com/project/wynn-mif/img/ai-artwork-1759867137807-thumb.png';

console.log('Testing thumbnail URL:', thumbnailUrl);

// Method 1: Direct image loading
const img = new Image();
img.onload = function() {
    console.log('✅ Direct image loading: SUCCESS');
    console.log('Image dimensions:', this.naturalWidth, 'x', this.naturalHeight);
};
img.onerror = function(e) {
    console.log('❌ Direct image loading: FAILED');
    console.log('Error event:', e);
};
img.src = thumbnailUrl;

// Method 2: Fetch API
fetch(thumbnailUrl)
    .then(response => {
        console.log('Fetch API response status:', response.status);
        console.log('Fetch API response headers:', [...response.headers.entries()]);
        if (response.ok) {
            console.log('✅ Fetch API: SUCCESS');
            return response.blob();
        } else {
            console.log('❌ Fetch API: FAILED with status', response.status);
            return null;
        }
    })
    .then(blob => {
        if (blob) {
            console.log('Blob size:', blob.size, 'bytes');
            console.log('Blob type:', blob.type);
        }
    })
    .catch(error => {
        console.log('❌ Fetch API: ERROR', error);
    });

// Method 3: XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('GET', thumbnailUrl);
xhr.onload = function() {
    if (xhr.status === 200) {
        console.log('✅ XMLHttpRequest: SUCCESS');
        console.log('Response size:', xhr.responseText.length, 'characters');
    } else {
        console.log('❌ XMLHttpRequest: FAILED with status', xhr.status);
    }
};
xhr.onerror = function() {
    console.log('❌ XMLHttpRequest: ERROR');
};
xhr.send();

console.log('=== End of Debug Script ===');