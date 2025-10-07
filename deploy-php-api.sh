#!/bin/bash

# PHP API Deployment Script
# This script helps deploy the PHP API to ebeesnet.com server

echo "Deploying PHP API to ebeesnet.com server..."
echo "========================================"

# Check if required files exist
if [ ! -f "./backend/upload.php" ]; then
    echo "Error: backend/upload.php not found!"
    exit 1
fi

echo "Found backend/upload.php"

# Instructions for manual upload
echo ""
echo "Please upload the following file to your ebeesnet.com server:"
echo "  Local file: ./backend/upload.php"
echo "  Server location: /project/wynn-mif/upload.php"
echo ""
echo "Also ensure the following directory exists and is writable:"
echo "  Server directory: /project/wynn-mif/img/"
echo ""
echo "You can use FTP, SFTP, or any file manager provided by your hosting service."
echo ""
echo "After uploading, test the API by visiting:"
echo "  https://ebeesnet.com/project/wynn-mif/upload.php"
echo ""
echo "Or use the test file:"
echo "  Open test-php-api.html in your browser"

echo ""
echo "Deployment instructions:"
echo "1. Upload backend/upload.php to /project/wynn-mif/upload.php on your server"
echo "2. Ensure /project/wynn-mif/img/ directory exists and is writable (chmod 755 or 777)"
echo "3. Test the API using test-php-api.html"

echo ""
echo "Deployment complete!"