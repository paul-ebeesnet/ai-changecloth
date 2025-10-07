# Complete Testing Guide

This document provides step-by-step instructions to test all the fixes and improvements made to the AI Changecloth application.

## Prerequisites

Before testing, ensure you have:

1. Node.js installed
2. All dependencies installed (`npm install` in both root and backend directories)
3. Environment variables configured correctly

## Testing Steps

### 1. Start Backend Server

Open a terminal and start the backend server:

```bash
cd backend
PORT=3002 node server.js
```

Verify the server is running by checking for the message "Backend server running on port 3002".

### 2. Start Frontend Application

Open another terminal and start the frontend:

```bash
npm run dev
```

The application should be accessible at http://localhost:3000.

### 3. Test Proxy Connection

Open http://localhost:3000/test-proxy.html in your browser and:

1. Click "Test Proxy Connection" - This should return a success message
2. Click "Test Upload Through Proxy" - This should successfully upload a test image

### 4. Test QRCode Loading

Open http://localhost:3000/test-qr-code-fix.html in your browser and:

1. Click "Test QRCode Generation" - This should generate a QR code without errors

### 5. Test Complete Flow

Open http://localhost:3000/test-complete-flow.html in your browser and:

1. Run through all test steps to verify the complete flow works

### 6. Test Actual Application

Open http://localhost:3000 in your browser and:

1. Go through the complete flow:
   - Upload a photo or use the camera
   - Confirm the photo
   - Wait for AI processing to complete
   - On the final result page, verify:
     * Images are uploaded successfully
     * Thumbnails are generated and displayed
     * QR codes are generated and displayed
     * Upload success message is shown

### 7. Verify Uploaded Files

Check that files have been uploaded to the server by visiting:
https://ebeesnet.com/project/wynn-mif/img/

You should see:
- The full-size image file
- The thumbnail file (with -thumb.png suffix)
- The QR code file (with -qrcode.png suffix)

## Troubleshooting

### If Upload Still Fails

1. Check browser console for errors
2. Check backend server console for errors
3. Verify environment variables are set correctly
4. Ensure the backend server is running on port 3002
5. Verify the Vite proxy configuration is correct

### If QRCode Generation Fails

1. Check network tab for failed CDN requests
2. Verify internet connectivity
3. Try accessing the CDN URLs directly in your browser

### If Thumbnails Are Not Displayed

1. Check that thumbnails are being generated on the server
2. Verify thumbnail URLs are correct
3. Check that thumbnail files are under 200KB

## Expected Outcomes

After completing all tests, you should see:

✅ Proxy connection working correctly
✅ QRCode generation working with fallback CDNs
✅ Image upload to FTP server successful
✅ Thumbnail generation under 200KB
✅ QR code generation and display
✅ Files accessible at https://ebeesnet.com/project/wynn-mif/img/
✅ Application working in both development and production modes

## Files to Verify

### Modified Files
- [vite.config.ts](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/vite.config.ts) - Updated proxy configuration
- [services/ftpUploadService.ts](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/services/ftpUploadService.ts) - Updated backend URL logic
- [.env.local](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/.env.local) - Added backend URL environment variable

### New Test Files
- [test-proxy.html](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/test-proxy.html) - Tests proxy connection
- [UPLOAD_FIX_SUMMARY.md](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/UPLOAD_FIX_SUMMARY.md) - Summary of upload fixes
- [TESTING_INSTRUCTIONS.md](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/TESTING_INSTRUCTIONS.md) - General testing instructions
- [FIXES_SUMMARY.md](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/FIXES_SUMMARY.md) - Summary of all fixes

## Additional Notes

- The application now uses a proxy in development mode to avoid CORS issues
- In production, it will use the configured backend URL or fall back to PHP API
- All external library loading (like QRCode) has fallback mechanisms
- Thumbnail generation ensures files are under 200KB
- Comprehensive error handling provides helpful messages to users