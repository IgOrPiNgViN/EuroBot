<?php
/**
 * SPA fallback — serves index.html for any route not matching a real file.
 * Needed because Masterhost's nginx doesn't process .htaccess for non-PHP requests.
 */
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// If requesting an actual file that exists — let the server handle it
$filePath = __DIR__ . $path;
if ($path !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

// For API and uploads — proxy to Timeweb
if (preg_match('#^/(api|uploads)/#', $path)) {
    require __DIR__ . '/proxy.php';
    exit;
}

// Everything else — serve the React SPA
readfile(__DIR__ . '/index.html');
