<?php
/**
 * Reverse proxy — forwards /api and /uploads requests to Timeweb backend.
 * Runs on Masterhost shared hosting (Apache + PHP).
 */

$BACKEND = 'http://85.239.60.54:8000';

$method = $_SERVER['REQUEST_METHOD'];
$uri    = $_SERVER['REQUEST_URI'];

$url = $BACKEND . $uri;

// Collect incoming headers to forward
$fwdHeaders = [];
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if ($lower === 'host' || $lower === 'connection') continue;
    $fwdHeaders[] = "$name: $value";
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER     => $fwdHeaders,
    CURLOPT_TIMEOUT        => 120,
    CURLOPT_CONNECTTIMEOUT => 15,
]);

// Forward request body (POST / PUT / PATCH)
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'multipart/form-data') !== false) {
        // File upload — rebuild as CURLFile
        $postFields = [];
        foreach ($_POST as $k => $v) {
            $postFields[$k] = $v;
        }
        foreach ($_FILES as $k => $file) {
            if (is_array($file['tmp_name'])) {
                foreach ($file['tmp_name'] as $i => $tmp) {
                    $postFields["{$k}[{$i}]"] = new CURLFile(
                        $tmp,
                        $file['type'][$i],
                        $file['name'][$i]
                    );
                }
            } else {
                $postFields[$k] = new CURLFile(
                    $file['tmp_name'],
                    $file['type'],
                    $file['name']
                );
            }
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        // Remove Content-Type header so cURL sets the correct boundary
        $fwdHeaders = array_filter($fwdHeaders, function ($h) {
            return stripos($h, 'Content-Type:') !== 0;
        });
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_values($fwdHeaders));
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['detail' => 'Backend unavailable: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$responseHeaders = substr($response, 0, $headerSize);
$responseBody    = substr($response, $headerSize);

// Set HTTP status
http_response_code($httpCode);

// Forward safe response headers
$passHeaders = [
    'content-type', 'content-disposition', 'content-length',
    'cache-control', 'etag', 'last-modified', 'x-total-count',
];
foreach (explode("\r\n", $responseHeaders) as $line) {
    if (empty($line) || strpos($line, ':') === false) continue;
    $lower = strtolower(substr($line, 0, strpos($line, ':')));
    if (in_array($lower, $passHeaders)) {
        header($line);
    }
}

echo $responseBody;
