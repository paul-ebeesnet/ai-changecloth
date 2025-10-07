// Simple test script to verify FTP upload functionality
const fs = require('fs');

// Read a test image file
const testImage = fs.readFileSync('../pattern3.png');
const base64Image = 'data:image/png;base64,' + testImage.toString('base64');
const filename = 'test-upload-' + Date.now() + '.png';

// Test the upload endpoint
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
    console.log('File should be available at:', data.url);
    
    // Test if the URL is accessible
    fetch(data.url)
      .then(response => {
        console.log('URL accessibility test:', response.status, response.statusText);
      })
      .catch(error => {
        console.log('URL accessibility test failed:', error.message);
      });
  }
})
.catch(error => {
  console.error('Upload error:', error);
});