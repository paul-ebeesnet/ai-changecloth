# Troubleshooting Guide: Image Upload Issues

This guide helps diagnose and resolve issues with image uploads in the AI 古裝青花瓷換裝秀 application.

## Common Issues and Solutions

### 1. PHP API Upload Fails

#### Symptoms:
- "圖片上傳服務暫時無法使用"
- "圖片處理完成！圖片上傳服務暫時無法使用"
- Images not appearing at https://ebeesnet.com/project/wynn-mif/img/

#### Diagnosis Steps:

1. **Test PHP API directly**:
   - Open `test-php-api.html` in your browser
   - Click "Test PHP API"
   - Check if it succeeds or fails

2. **Check server environment**:
   - Upload `backend/server-test.php` to your server
   - Visit https://ebeesnet.com/project/wynn-mif/server-test.php
   - Verify that:
     - PHP version is 7.0 or higher
     - GD extension is loaded
     - Directory permissions are correct

3. **Check directory permissions**:
   - Ensure `/project/wynn-mif/img/` directory exists
   - Ensure the directory is writable (chmod 755 or 777)

4. **Check server error logs**:
   - Look for PHP errors in your server's error log
   - Check if there are any permission denied errors

#### Solutions:

1. **Fix directory permissions**:
   ```bash
   chmod 755 /project/wynn-mif/
   chmod 777 /project/wynn-mif/img/
   ```

2. **Verify PHP extensions**:
   - Ensure GD library is installed and enabled
   - Ensure JSON support is available

3. **Check file size limits**:
   - Verify PHP `upload_max_filesize` and `post_max_size` settings
   - Large images might exceed these limits

### 2. CORS Issues

#### Symptoms:
- Console errors about CORS policy
- Network tab shows failed requests
- Upload appears to succeed but no response is received

#### Solutions:
- The PHP API already includes CORS headers
- Ensure no additional security policies are blocking requests

### 3. Network/Firewall Issues

#### Symptoms:
- Requests time out
- Connection refused errors
- Intermittent failures

#### Solutions:
- Check if your server is accessible from the internet
- Verify that port 443 (HTTPS) is open
- Test connectivity from different networks

## Debugging Steps

### 1. Browser Console Debugging

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Reproduce the upload issue
4. Look for error messages, particularly:
   - Network errors
   - JavaScript exceptions
   - PHP API response details

### 2. Network Request Analysis

1. Open Developer Tools
2. Go to the Network tab
3. Reproduce the upload
4. Find the request to `upload.php`
5. Check:
   - Request headers
   - Request payload
   - Response status
   - Response body

### 3. Server-Side Debugging

1. Check PHP error logs on your server
2. Look for entries around the time of failed uploads
3. Enable detailed error reporting if needed:
   ```php
   ini_set('display_errors', 1);
   ini_set('display_startup_errors', 1);
   error_reporting(E_ALL);
   ```

## Testing Checklist

Before reporting issues, verify:

- [ ] `test-php-api.html` works correctly
- [ ] `server-test.php` shows all required extensions are loaded
- [ ] `/project/wynn-mif/img/` directory exists and is writable
- [ ] No JavaScript errors in browser console
- [ ] Network requests to `upload.php` are successful
- [ ] PHP error logs show no errors during upload

## Common Error Messages and Fixes

### "Failed to upload image via PHP API: Failed to fetch"

This usually indicates a network issue or CORS problem:
- Verify the URL is correct: https://ebeesnet.com/project/wynn-mif/upload.php
- Check if the server is accessible
- Ensure CORS headers are properly set (they are in our PHP API)

### "Failed to upload image via PHP API: Internal Server Error"

This indicates a server-side PHP error:
- Check server error logs
- Verify PHP extensions are installed
- Check file permissions

### "圖片上傳服務暫時無法使用 (部署限制)"

This appears when all upload methods have failed:
- The system falls back to this message when PHP API, FTP, and Cloudinary all fail
- Check each upload method individually to identify the root cause

## Contact Support

If you've tried all the above steps and are still experiencing issues, please provide:

1. Browser console output
2. Network request details (from Developer Tools)
3. Server error logs (if accessible)
4. Results from `test-php-api.html` and `server-test.php`
5. Description of what you've already tried

This information will help diagnose and resolve the issue more quickly.