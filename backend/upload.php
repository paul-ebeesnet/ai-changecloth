<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Log incoming request for debugging
    error_log("PHP API request received at " . date('Y-m-d H:i:s'));
    error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
    error_log("Content type: " . ($_SERVER['CONTENT_TYPE'] ?? 'unknown'));
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log("Input data keys: " . print_r(array_keys($input ?? []), true));
    
    if (!$input || !isset($input['image']) || !isset($input['filename'])) {
        error_log("Missing required fields");
        throw new Exception('Missing image data or filename');
    }
    
    $imageData = $input['image'];
    $filename = $input['filename'];
    $qrCodeImage = $input['qrCodeImage'] ?? null;
    
    error_log("Processing file: " . $filename);
    
    // Validate filename
    if (!preg_match('/^[a-zA-Z0-9\-_\.]+\.png$/', $filename)) {
        error_log("Invalid filename: " . $filename);
        throw new Exception('Invalid filename. Only alphanumeric characters, hyphens, underscores, and dots allowed. Must end with .png');
    }
    
    // Decode base64 image
    $base64Data = str_replace('data:image/png;base64,', '', $imageData);
    $imageData = base64_decode($base64Data);
    
    if ($imageData === false) {
        error_log("Failed to decode image data");
        throw new Exception('Failed to decode image data');
    }
    
    error_log("Image data decoded, size: " . strlen($imageData) . " bytes");
    
    // Define upload directory (adjusted for ebeesnet.com structure)
    // Based on your FTP directory structure mapping, we need to use the correct path
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/project/wynn-mif/img/';
    
    error_log("Upload directory: " . $uploadDir);
    error_log("Upload directory exists: " . (file_exists($uploadDir) ? "yes" : "no"));
    error_log("Upload directory writable: " . (is_writable($uploadDir) ? "yes" : "no"));
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        error_log("Creating directory: " . $uploadDir);
        if (!mkdir($uploadDir, 0755, true)) {
            error_log("Failed to create directory: " . $uploadDir);
            throw new Exception('Failed to create upload directory');
        }
        error_log("Directory created successfully");
    }
    
    // Check if directory is writable
    if (!is_writable($uploadDir)) {
        error_log("Upload directory is not writable: " . $uploadDir);
        throw new Exception('Upload directory is not writable');
    }
    
    // Save main image
    $mainImagePath = $uploadDir . $filename;
    error_log("Saving main image to: " . $mainImagePath);
    
    if (file_put_contents($mainImagePath, $imageData) === false) {
        error_log("Failed to save main image to: " . $mainImagePath);
        throw new Exception('Failed to save main image');
    }
    
    error_log("Main image saved successfully");
    error_log("Main image file exists: " . (file_exists($mainImagePath) ? "yes" : "no"));
    error_log("Main image file size: " . (file_exists($mainImagePath) ? filesize($mainImagePath) : "N/A") . " bytes");
    
    // Generate thumbnail
    $thumbnailFilename = str_replace('.png', '-thumb.png', $filename);
    $thumbnailPath = $uploadDir . $thumbnailFilename;
    
    error_log("Generating thumbnail: " . $thumbnailPath);
    error_log("Thumbnail path writable: " . (is_writable(dirname($thumbnailPath)) ? "yes" : "no"));
    
    // Create thumbnail using GD library with improved error handling
    $thumbnailSuccess = createThumbnail($mainImagePath, $thumbnailPath, 800, 200 * 1024); // 200KB limit
    
    error_log("Thumbnail generation " . ($thumbnailSuccess ? "successful" : "failed"));
    error_log("Thumbnail file exists after generation: " . (file_exists($thumbnailPath) ? "yes" : "no"));
    if (file_exists($thumbnailPath)) {
        error_log("Thumbnail file size: " . filesize($thumbnailPath) . " bytes");
    }
    
    // Save QR code if provided
    $qrCodePath = null;
    if ($qrCodeImage) {
        $qrCodeFilename = str_replace('.png', '-qrcode.png', $filename);
        $qrCodePath = $uploadDir . $qrCodeFilename;
        error_log("Saving QR code to: " . $qrCodePath);
        error_log("QR code path writable: " . (is_writable(dirname($qrCodePath)) ? "yes" : "no"));
        
        $qrCodeData = str_replace('data:image/png;base64,', '', $qrCodeImage);
        $qrCodeImageData = base64_decode($qrCodeData);
        if ($qrCodeImageData !== false) {
            if (file_put_contents($qrCodePath, $qrCodeImageData) !== false) {
                error_log("QR code saved successfully");
                error_log("QR code file exists: " . (file_exists($qrCodePath) ? "yes" : "no"));
                if (file_exists($qrCodePath)) {
                    error_log("QR code file size: " . filesize($qrCodePath) . " bytes");
                }
            } else {
                error_log("Failed to save QR code");
            }
        } else {
            error_log("Failed to decode QR code data");
        }
    }
    
    // Return success response with correct URLs
    $baseUrl = 'https://ebeesnet.com/project/wynn-mif/img/';
    error_log("Returning success response");
    error_log("Main image URL: " . $baseUrl . $filename);
    error_log("Thumbnail URL: " . ($thumbnailSuccess && file_exists($thumbnailPath) ? $baseUrl . $thumbnailFilename : "null"));
    error_log("Thumbnail file exists at response time: " . (file_exists($thumbnailPath) ? "yes" : "no"));
    
    // Prepare response data
    $responseData = [
        'success' => true,
        'url' => $baseUrl . $filename,
        'thumbnailUrl' => $thumbnailSuccess && file_exists($thumbnailPath) ? $baseUrl . $thumbnailFilename : null,
        'message' => 'Image uploaded successfully'
    ];
    
    // Log the actual response data for debugging
    error_log("Response data: " . json_encode($responseData));
    
    echo json_encode($responseData);
    
} catch (Exception $e) {
    error_log("PHP API error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function createThumbnail($sourcePath, $destPath, $maxSize, $maxFileSize) {
    try {
        error_log("=== THUMBNAIL GENERATION START ===");
        error_log("Creating thumbnail from " . $sourcePath . " to " . $destPath);
        error_log("Source file exists: " . (file_exists($sourcePath) ? "yes" : "no"));
        error_log("Destination directory writable: " . (is_writable(dirname($destPath)) ? "yes" : "no"));
        error_log("Max size: " . $maxSize . ", Max file size: " . $maxFileSize);
        
        // Check if source file exists
        if (!file_exists($sourcePath)) {
            error_log("ERROR: Source file does not exist: " . $sourcePath);
            return false;
        }
        
        // Get image information
        $imageInfo = getimagesize($sourcePath);
        if (!$imageInfo) {
            error_log("ERROR: Failed to get image info from " . $sourcePath);
            return false;
        }
        
        error_log("Image info: " . print_r($imageInfo, true));
        
        // Create image resource based on type
        $src = null;
        switch ($imageInfo[2]) {
            case IMAGETYPE_JPEG:
                $src = imagecreatefromjpeg($sourcePath);
                error_log("Created JPEG image resource");
                break;
            case IMAGETYPE_PNG:
                $src = imagecreatefrompng($sourcePath);
                error_log("Created PNG image resource");
                break;
            case IMAGETYPE_GIF:
                $src = imagecreatefromgif($sourcePath);
                error_log("Created GIF image resource");
                break;
            default:
                error_log("ERROR: Unsupported image type: " . $imageInfo[2]);
                return false;
        }
        
        if (!$src) {
            error_log("ERROR: Failed to create image resource");
            return false;
        }
        
        $width = imagesx($src);
        $height = imagesy($src);
        
        error_log("Original image size: " . $width . "x" . $height);
        
        // Calculate new dimensions maintaining aspect ratio
        $ratio = min($maxSize / $width, $maxSize / $height);
        $newWidth = intval($width * $ratio);
        $newHeight = intval($height * $ratio);
        
        // Ensure minimum size of 1px
        $newWidth = max(1, $newWidth);
        $newHeight = max(1, $newHeight);
        
        error_log("Calculated thumbnail size: " . $newWidth . "x" . $newHeight);
        
        // Create thumbnail
        $dst = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG
        if ($imageInfo[2] === IMAGETYPE_PNG) {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
            imagefilledrectangle($dst, 0, 0, $newWidth, $newHeight, $transparent);
        }
        
        // Resize image
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        
        // Try different compression levels
        $qualityLevels = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]; // PNG compression levels (0-9)
        $success = false;
        
        foreach ($qualityLevels as $quality) {
            ob_start();
            imagepng($dst, null, $quality);
            $imageData = ob_get_contents();
            ob_end_clean();
            
            $dataSize = strlen($imageData);
            error_log("Trying PNG compression level " . $quality . ", size: " . $dataSize . " bytes");
            
            if ($dataSize <= $maxFileSize) {
                error_log("SUCCESS: Image data at compression level " . $quality . " is within limit (" . $dataSize . " <= " . $maxFileSize . ")");
                
                // Save the image data
                $writeResult = file_put_contents($destPath, $imageData);
                if ($writeResult !== false) {
                    error_log("SUCCESS: Thumbnail saved to " . $destPath . " (size: " . filesize($destPath) . " bytes)");
                    $success = true;
                    break;
                } else {
                    error_log("ERROR: Failed to save thumbnail to " . $destPath);
                }
            } else {
                error_log("Image data at compression level " . $quality . " is too large (" . $dataSize . " > " . $maxFileSize . ")");
            }
        }
        
        // If still no success, try with more aggressive size reduction
        if (!$success) {
            error_log("Trying more aggressive size reduction...");
            
            // Reduce max dimensions further
            $smallerMaxSize = 400; // Reduced from 800
            $ratio = min($smallerMaxSize / $width, $smallerMaxSize / $height);
            $newWidth = max(1, intval($width * $ratio));
            $newHeight = max(1, intval($height * $ratio));
            
            error_log("Recalculated smaller thumbnail size: " . $newWidth . "x" . $newHeight);
            
            // Create a new smaller thumbnail
            $smallDst = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($imageInfo[2] === IMAGETYPE_PNG) {
                imagealphablending($smallDst, false);
                imagesavealpha($smallDst, true);
                $transparent = imagecolorallocatealpha($smallDst, 255, 255, 255, 127);
                imagefilledrectangle($smallDst, 0, 0, $newWidth, $newHeight, $transparent);
            }
            
            // Resize image to smaller size
            imagecopyresampled($smallDst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            
            // Try default compression on smaller image
            ob_start();
            imagepng($smallDst, null);
            $imageData = ob_get_contents();
            ob_end_clean();
            
            $dataSize = strlen($imageData);
            error_log("Smaller image default compression size: " . $dataSize . " bytes");
            
            if ($dataSize <= $maxFileSize) {
                $writeResult = file_put_contents($destPath, $imageData);
                if ($writeResult !== false) {
                    error_log("SUCCESS: Smaller thumbnail saved to " . $destPath . " (size: " . filesize($destPath) . " bytes)");
                    $success = true;
                } else {
                    error_log("ERROR: Failed to save smaller thumbnail to " . $destPath);
                }
            } else {
                error_log("ERROR: Even smaller image is too large (" . $dataSize . " > " . $maxFileSize . ")");
            }
            
            // Cleanup smaller image resource
            imagedestroy($smallDst);
        }
        
        // If still no success, try with lowest quality and smallest size
        if (!$success) {
            error_log("Trying lowest quality and smallest size...");
            
            // Use minimum dimensions
            $minSize = 200;
            $ratio = min($minSize / $width, $minSize / $height);
            $newWidth = max(1, intval($width * $ratio));
            $newHeight = max(1, intval($height * $ratio));
            
            error_log("Recalculated minimum thumbnail size: " . $newWidth . "x" . $newHeight);
            
            // Create a new minimum size thumbnail
            $minDst = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($imageInfo[2] === IMAGETYPE_PNG) {
                imagealphablending($minDst, false);
                imagesavealpha($minDst, true);
                $transparent = imagecolorallocatealpha($minDst, 255, 255, 255, 127);
                imagefilledrectangle($minDst, 0, 0, $newWidth, $newHeight, $transparent);
            }
            
            // Resize image to minimum size
            imagecopyresampled($minDst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            
            // Try lowest compression on minimum size image
            ob_start();
            imagepng($minDst, null, 9); // Highest compression (smallest file size)
            $imageData = ob_get_contents();
            ob_end_clean();
            
            $dataSize = strlen($imageData);
            error_log("Minimum size with highest compression size: " . $dataSize . " bytes");
            
            if ($dataSize <= $maxFileSize) {
                $writeResult = file_put_contents($destPath, $imageData);
                if ($writeResult !== false) {
                    error_log("SUCCESS: Minimum thumbnail saved to " . $destPath . " (size: " . filesize($destPath) . " bytes)");
                    $success = true;
                } else {
                    error_log("ERROR: Failed to save minimum thumbnail to " . $destPath);
                }
            } else {
                error_log("ERROR: Even minimum size image is too large (" . $dataSize . " > " . $maxFileSize . ")");
            }
            
            // Cleanup minimum image resource
            imagedestroy($minDst);
        }
        
        // Cleanup
        imagedestroy($src);
        imagedestroy($dst);
        
        // Final verification
        $fileExists = file_exists($destPath);
        $fileSize = $fileExists ? filesize($destPath) : 0;
        error_log("Final verification - File exists: " . ($fileExists ? "yes" : "no") . ", Size: " . $fileSize . " bytes");
        error_log("Thumbnail creation result: " . ($success ? "SUCCESS" : "FAILED"));
        error_log("=== THUMBNAIL GENERATION END ===");
        
        return $success && $fileExists && $fileSize <= $maxFileSize;
        
    } catch (Exception $e) {
        error_log("FATAL ERROR in thumbnail creation: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        return false;
    }
}
?>