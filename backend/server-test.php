<?php
// Server Environment Test Script
header('Content-Type: application/json');

$result = [
    'success' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ],
    'extensions' => [
        'gd' => extension_loaded('gd'),
        'json' => extension_loaded('json'),
        'curl' => extension_loaded('curl')
    ],
    'directories' => [],
    'permissions' => []
];

// Test directory access
$testDirs = [
    $_SERVER['DOCUMENT_ROOT'],
    $_SERVER['DOCUMENT_ROOT'] . '/project',
    $_SERVER['DOCUMENT_ROOT'] . '/project/wynn-mif',
    $_SERVER['DOCUMENT_ROOT'] . '/project/wynn-mif/img'
];

foreach ($testDirs as $dir) {
    $result['directories'][$dir] = [
        'exists' => file_exists($dir),
        'is_dir' => is_dir($dir),
        'is_writable' => is_writable($dir),
        'permissions' => file_exists($dir) ? substr(sprintf('%o', fileperms($dir)), -4) : null
    ];
}

// Test GD functions
if (extension_loaded('gd')) {
    $result['gd_info'] = gd_info();
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>