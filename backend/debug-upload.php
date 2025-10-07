<?php
// Debug version of the upload API that logs detailed information
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    error_log("DEBUG UPLOAD: OPTIONS request received");
    http_response_code(200);
    exit();
}

error_log("DEBUG UPLOAD: Request received at " . date('Y-m-d H:i:s'));
error_log("DEBUG UPLOAD: Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
error_log("DEBUG UPLOAD: Content type: " . ($_SERVER['CONTENT_TYPE'] ?? 'unknown'));
error_log("DEBUG UPLOAD: Content length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'unknown'));
error_log("DEBUG UPLOAD: Request URI: " . ($_SERVER['REQUEST_URI'] ?? 'unknown'));

// Log raw input
$rawInput = file_get_contents('php://input');
error_log("DEBUG UPLOAD: Raw input length: " . strlen($rawInput));

// Try to parse as JSON
$input = json_decode($rawInput, true);
if ($input === null) {
    error_log("DEBUG UPLOAD: Failed to parse JSON");
    error_log("DEBUG UPLOAD: JSON error: " . json_last_error_msg());
} else {
    error_log("DEBUG UPLOAD: JSON parsed successfully");
    error_log("DEBUG UPLOAD: Input keys: " . print_r(array_keys($input), true));
    
    if (isset($input['filename'])) {
        error_log("DEBUG UPLOAD: Filename: " . $input['filename']);
    }
    
    if (isset($input['image'])) {
        error_log("DEBUG UPLOAD: Image data length: " . strlen($input['image']));
        error_log("DEBUG UPLOAD: Image data prefix: " . substr($input['image'], 0, 100));
    }
    
    if (isset($input['qrCodeImage'])) {
        error_log("DEBUG UPLOAD: QR code data length: " . strlen($input['qrCodeImage']));
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("DEBUG UPLOAD: Invalid method");
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Return success response for debugging
error_log("DEBUG UPLOAD: Returning success response");
echo json_encode([
    'success' => true,
    'message' => 'Debug upload received successfully',
    'received_at' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'unknown',
    'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'unknown'
]);
?>