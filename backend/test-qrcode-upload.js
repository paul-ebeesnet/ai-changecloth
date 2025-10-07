// Test script to verify the QR code upload functionality
const fs = require('fs');

// Read a test image file
const testImage = fs.readFileSync('../pattern3.png');
const base64Image = 'data:image/png;base64,' + testImage.toString('base64');
const filename = 'test-artwork-' + Date.now() + '.png';

// Test the upload endpoint with QR code
fetch('http://localhost:3001/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: base64Image,
    filename: filename
  }),
})
.then(response => response.json())
.then(data => {
  console.log('Upload result:', data);
  if (data.success) {
    console.log('Artwork should be available at:', data.url);
    
    // Test if the artwork URL is accessible
    fetch(data.url)
      .then(response => {
        console.log('Artwork URL accessibility test:', response.status, response.statusText);
      })
      .catch(error => {
        console.log('Artwork URL accessibility test failed:', error.message);
      });
      
    // Test if the QR code is also available (with -qrcode.png suffix)
    const qrCodeUrl = data.url.replace('.png', '-qrcode.png');
    console.log('QR Code should be available at:', qrCodeUrl);
    
    fetch(qrCodeUrl)
      .then(response => {
        console.log('QR Code URL accessibility test:', response.status, response.statusText);
      })
      .catch(error => {
        console.log('QR Code URL accessibility test failed:', error.message);
      });
  }
})
.catch(error => {
  console.error('Upload error:', error);
});