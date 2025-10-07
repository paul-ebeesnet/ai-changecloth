# PHP API Deployment Guide

This guide explains how to deploy and use the PHP API for handling image uploads on your ebeesnet.com server.

## File Locations

1. **PHP API File**: `backend/upload.php`
2. **Deployment Location**: `https://ebeesnet.com/project/wynn-mif/upload.php`
3. **Image Storage**: `https://ebeesnet.com/project/wynn-mif/img/`

## Deployment Steps

1. Upload the `backend/upload.php` file to your ebeesnet.com server at the path:
   ```
   /project/wynn-mif/upload.php
   ```

2. Ensure the image directory exists and is writable:
   ```
   /project/wynn-mif/img/
   ```

3. Set proper permissions on the image directory (usually 755 or 777):
   ```bash
   chmod 755 /project/wynn-mif/img/
   ```

## How It Works

The PHP API handles the following tasks:

1. **Image Upload**: Receives base64 encoded images and saves them to the server
2. **Thumbnail Generation**: Automatically creates thumbnails under 200KB
3. **QR Code Generation**: Accepts QR codes from the frontend and saves them
4. **File Naming**: Uses the convention:
   - Original image: `filename.png`
   - Thumbnail: `filename-thumb.png`
   - QR Code: `filename-qrcode.png`

## API Endpoints

### Upload Image

**URL**: `https://ebeesnet.com/project/wynn-mif/upload.php`

**Method**: `POST`

**Headers**: 
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "image": "data:image/png;base64,...",  // Base64 encoded image
  "filename": "ai-artwork-123456789.png",  // Filename for the image
  "qrCodeImage": "data:image/png;base64,..."  // Optional QR code image
}
```

**Response**:
```json
{
  "success": true,
  "url": "https://ebeesnet.com/project/wynn-mif/img/ai-artwork-123456789.png",
  "thumbnailUrl": "https://ebeesnet.com/project/wynn-mif/img/ai-artwork-123456789-thumb.png",
  "message": "Image uploaded successfully"
}
```

## Testing the API

You can test the API using the provided `test-php-api.html` file or with curl:

```bash
curl -X POST https://ebeesnet.com/project/wynn-mif/upload.php \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "filename": "test-image.png"
  }'
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the `/project/wynn-mif/img/` directory is writable
2. **File Not Found**: Verify the PHP file is uploaded to the correct location
3. **Upload Failed**: Check that the base64 image data is correctly formatted
4. **Internal Server Error**: Check server error logs for PHP errors

### Server Requirements

The PHP API requires:
- PHP 7.0 or higher
- GD library for image processing
- Write permissions to the image directory
- Sufficient memory limit for image processing (recommended: 128MB or higher)

### Debugging Server Issues

1. **Check PHP configuration**:
   Upload `backend/server-test.php` to verify server environment

2. **Enable error logging**:
   Add these lines to the beginning of `upload.php` for debugging:
   ```php
   ini_set('display_errors', 1);
   ini_set('display_startup_errors', 1);
   error_reporting(E_ALL);
   ```

3. **Check server error logs**:
   Look for PHP errors in your hosting provider's error log

### Verifying GD Library

The PHP API requires the GD library for thumbnail generation. You can verify it's available by creating a simple test file:

```php
<?php
if (extension_loaded('gd')) {
    echo "GD Library is available\n";
    print_r(gd_info());
} else {
    echo "GD Library is NOT available\n";
}
?>
```

## Integration with Frontend

The frontend automatically uses the PHP API in production environments when deployed on Vercel or similar serverless platforms. No additional configuration is needed.

The upload service will:
1. First try to use the PHP API
2. Fall back to Cloudinary if configured
3. Fall back to FTP if a backend URL is configured
4. Finally fall back to generating a QR code with an error message

## Security Considerations

The PHP API includes basic security measures:
- Filename validation to prevent directory traversal
- Image type validation
- CORS headers for cross-origin requests

For production use, consider adding:
- Authentication tokens
- Rate limiting
- File size limits
- Additional input validation

See [TROUBLESHOOTING.md](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/TROUBLESHOOTING.md) for detailed troubleshooting steps if you encounter any issues.