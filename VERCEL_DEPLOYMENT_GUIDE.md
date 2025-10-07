# Vercel Deployment Guide

This document explains how to properly deploy the AI Changecloth application to Vercel, taking into account Vercel's serverless architecture limitations.

## Vercel Architecture Limitations

Vercel is a serverless platform that:
- Does not support long-running backend services
- Does not allow direct FTP connections from frontend code
- Requires all backend functionality to be implemented as serverless functions or external APIs

## Correct Deployment Approach

### 1. Use PHP API for File Uploads

Instead of relying on a Node.js backend server, use the PHP API hosted on your ebeesnet.com server:

1. The PHP API endpoint is at: `https://ebeesnet.com/project/wynn-mif/upload.php`
2. This endpoint handles:
   - Image upload to FTP server
   - Thumbnail generation (under 200KB)
   - QR code generation and storage
   - All file operations that cannot be done directly from frontend

### 2. Environment Configuration

For Vercel deployments, configure these environment variables in your Vercel project settings:

```
# Not needed for PHP API approach
# REACT_APP_BACKEND_URL (leave unset or blank)

# Optional: For Cloudinary fallback
# CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Upload Flow in Production

In production (Vercel deployment), the application will:

1. First try to upload via PHP API (`uploadViaPHP` function)
2. If PHP API fails and Cloudinary is configured, try Cloudinary (`uploadToCloudinary` function)
3. If all methods fail, generate a QR code with error message (`generateQRCodeFromDataUrl` function)

### 4. Why This Approach Works

- PHP scripts can run independently on traditional hosting without long-running processes
- The PHP API handles all file operations that are not possible in serverless frontend environments
- No need to maintain or deploy a separate Node.js backend service
- Works reliably with Vercel's serverless architecture

## Testing the PHP API

Before deploying to Vercel, test the PHP API directly:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "filename": "test-artwork.png"
  }' \
  https://ebeesnet.com/project/wynn-mif/upload.php
```

You should receive a response like:
```json
{
  "success": true,
  "url": "https://ebeesnet.com/project/wynn-mif/img/test-artwork.png",
  "thumbnailUrl": "https://ebeesnet.com/project/wynn-mif/img/test-artwork-thumb.png",
  "message": "Image uploaded successfully"
}
```

## Files That Handle Vercel Deployment

### App.tsx
- Uses `uploadViaPHP` as primary method in production
- Has proper fallback handling for Vercel limitations
- Shows appropriate error messages when backend services are not available

### services/ftpUploadService.ts
- `uploadViaPHP` function handles PHP API communication
- `uploadToFTP` function properly detects Vercel deployment and throws appropriate errors
- All functions have robust error handling with fallbacks

## Common Issues and Solutions

### 1. "FTP uploads are not supported" Error
**Cause**: Trying to use FTP upload in Vercel production environment
**Solution**: Ensure PHP API is used instead (it's the default in production)

### 2. CORS Issues with PHP API
**Cause**: Server configuration problems
**Solution**: PHP API already has proper CORS headers configured

### 3. Thumbnail Generation Failures
**Cause**: Server-side GD library issues
**Solution**: Check with hosting provider to ensure GD library is enabled

## Verification Steps

After deploying to Vercel:

1. Open your deployed application
2. Go through the complete flow (upload photo → AI processing → final result)
3. On the final result page, verify:
   - Images are uploaded successfully via PHP API
   - Thumbnails are generated and displayed
   - QR codes are generated and displayed
   - Files are accessible at https://ebeesnet.com/project/wynn-mif/img/

## Important Notes

- Never try to deploy a Node.js backend service to Vercel for this application
- Always use the PHP API approach for file uploads in production
- The development environment can still use the Node.js backend for local testing
- Cloudinary is a good alternative if PHP API is not available