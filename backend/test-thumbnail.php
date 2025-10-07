<?php
// Test thumbnail generation
error_log("=== Thumbnail Generation Test ===");

// Create a simple test image
$testImagePath = __DIR__ . '/test-image.png';
$testThumbPath = __DIR__ . '/test-image-thumb.png';

// Create a simple 100x100 PNG image for testing
$im = imagecreate(100, 100);
$background = imagecolorallocate($im, 255, 255, 255);
$textColor = imagecolorallocate($im, 0, 0, 0);
imagestring($im, 5, 10, 30, 'Test', $textColor);

// Save test image
imagepng($im, $testImagePath);
imagedestroy($im);

error_log("Test image created at: " . $testImagePath);
error_log("Test image exists: " . (file_exists($testImagePath) ? "yes" : "no"));
error_log("Test image size: " . (file_exists($testImagePath) ? filesize($testImagePath) : "N/A") . " bytes");

// Test thumbnail function
function createThumbnail($sourcePath, $destPath, $maxSize, $maxFileSize) {
    try {
        error_log("Creating thumbnail from " . $sourcePath . " to " . $destPath);
        
        // Get image information
        $imageInfo = getimagesize($sourcePath);
        if (!$imageInfo) {
            error_log("Failed to get image info from " . $sourcePath);
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
                error_log("Unsupported image type: " . $imageInfo[2]);
                return false;
        }
        
        if (!$src) {
            error_log("Failed to create image resource");
            return false;
        }
        
        $width = imagesx($src);
        $height = imagesy($src);
        
        error_log("Original image size: " . $width . "x" . $height);
        
        // Calculate new dimensions maintaining aspect ratio
        $ratio = min($maxSize / $width, $maxSize / $height);
        $newWidth = intval($width * $ratio);
        $newHeight = intval($height * $ratio);
        
        error_log("Thumbnail size: " . $newWidth . "x" . $newHeight);
        
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
        
        // Save with quality adjustment to meet file size limit
        $quality = 90;
        $success = false;
        
        do {
            ob_start();
            // For PNG, quality is compression level (0-9)
            imagepng($dst, null, intval($quality / 10));
            $imageData = ob_get_contents();
            ob_end_clean();
            
            error_log("Thumbnail data size at quality " . $quality . ": " . strlen($imageData) . " bytes");
            
            if (strlen($imageData) <= $maxFileSize) {
                if (file_put_contents($destPath, $imageData) !== false) {
                    error_log("Thumbnail saved successfully at quality " . $quality);
                    $success = true;
                    break;
                } else {
                    error_log("Failed to save thumbnail to " . $destPath);
                    break;
                }
            }
            
            $quality -= 10;
        } while ($quality >= 0); // Changed from > 10 to >= 0 to try all quality levels
        
        // If we still haven't succeeded, try with the lowest quality
        if (!$success && strlen($imageData) > $maxFileSize) {
            error_log("Thumbnail still too large, trying lowest quality");
            ob_start();
            imagepng($dst, null, 9); // Maximum compression
            $imageData = ob_get_contents();
            ob_end_clean();
            
            if (strlen($imageData) <= $maxFileSize) {
                if (file_put_contents($destPath, $imageData) !== false) {
                    error_log("Thumbnail saved successfully with maximum compression");
                    $success = true;
                }
            }
        }
        
        // Cleanup
        imagedestroy($src);
        imagedestroy($dst);
        
        $fileExists = file_exists($destPath);
        $fileSize = $fileExists ? filesize($destPath) : 0;
        error_log("Thumbnail creation " . ($success ? "successful" : "failed") . 
                  ", file exists: " . ($fileExists ? "yes" : "no") . 
                  ", size: " . $fileSize . " bytes" .
                  ", under limit: " . ($fileSize <= $maxFileSize ? "yes" : "no"));
        
        return $success && $fileExists && $fileSize <= $maxFileSize;
        
    } catch (Exception $e) {
        error_log("Thumbnail creation failed: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        return false;
    }
}

// Test thumbnail creation
$result = createThumbnail($testImagePath, $testThumbPath, 800, 200 * 1024);
error_log("Thumbnail creation result: " . ($result ? "success" : "failed"));

// Clean up test files
if (file_exists($testImagePath)) {
    unlink($testImagePath);
    error_log("Test image deleted");
}

if (file_exists($testThumbPath)) {
    unlink($testThumbPath);
    error_log("Test thumbnail deleted");
}

echo json_encode([
    'success' => true,
    'message' => 'Thumbnail test completed',
    'result' => $result
]);
?>