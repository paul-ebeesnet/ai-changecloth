<?php
// Test script for thumbnail generation function

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

// Test the function
echo "Testing thumbnail generation function...\n";

// Create a test image
$testImagePath = 'test-image.png';
$testThumbPath = 'test-thumb.png';

// Create a simple test PNG image
$im = imagecreate(100, 100);
$background = imagecolorallocate($im, 255, 255, 255);
$textColor = imagecolorallocate($im, 0, 0, 0);
imagestring($im, 5, 10, 30, 'Test', $textColor);
imagepng($im, $testImagePath);
imagedestroy($im);

echo "Created test image: " . $testImagePath . "\n";

// Test thumbnail generation
$result = createThumbnail($testImagePath, $testThumbPath, 800, 200 * 1024); // 200KB limit

echo "Thumbnail generation result: " . ($result ? "SUCCESS" : "FAILED") . "\n";

if ($result && file_exists($testThumbPath)) {
    echo "Thumbnail created successfully: " . $testThumbPath . "\n";
    echo "Thumbnail size: " . filesize($testThumbPath) . " bytes\n";
} else {
    echo "Failed to create thumbnail\n";
}

// Clean up test files
if (file_exists($testImagePath)) {
    unlink($testImagePath);
}
if (file_exists($testThumbPath)) {
    unlink($testThumbPath);
}

echo "Test completed.\n";
?>