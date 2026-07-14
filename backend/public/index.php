<?php

declare(strict_types=1);

use App\Infrastructure\Http\Router;

if (is_file(__DIR__ . '/../vendor/autoload.php')) {
	require_once __DIR__ . '/../vendor/autoload.php';
} else {
	spl_autoload_register(static function (string $class): void {
		$prefix = 'App\\';
		if (!str_starts_with($class, $prefix)) {
			return;
		}

		$relativeClass = substr($class, strlen($prefix));
		$path = __DIR__ . '/../app/' . str_replace('\\', '/', $relativeClass) . '.php';
		if (is_file($path)) {
			require_once $path;
		}
	});
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
	http_response_code(204);
	exit;
}

$routes = require __DIR__ . '/../routes/api.php';
$router = new Router($routes);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';

$prefixes = [
	'/SocialMediaAnalyticsDashboard/api',
	'/api',
];

foreach ($prefixes as $prefix) {
	if (str_starts_with($uri, $prefix)) {
		$uri = substr($uri, strlen($prefix));
		if ($uri === false || $uri === '') {
			$uri = '/';
		}
		break;
	}
}

$rawBody = file_get_contents('php://input') ?: '';
$decodedBody = json_decode($rawBody, true);
$headers = function_exists('getallheaders') ? getallheaders() : [];

$request = [
	'method' => $method,
	'uri' => $uri,
	'path' => parse_url($uri, PHP_URL_PATH) ?: '/',
	'query' => $_GET,
	'body' => is_array($decodedBody) ? $decodedBody : [],
	'headers' => is_array($headers) ? $headers : [],
];

$response = $router->dispatch($method, $uri, $request);

$status = (int) ($response['status'] ?? 500);
$body = is_array($response['body'] ?? null) ? $response['body'] : ['error' => 'server_error', 'message' => 'Invalid response'];

$jsonApiBody = static function (array $payload, int $httpStatus): array {
	$timestamp = gmdate('c');
	$isError = isset($payload['error']) || $httpStatus >= 400;

	if ($isError) {
		return [
			'errors' => [[
				'status' => (string) $httpStatus,
				'code' => (string) ($payload['error'] ?? 'error'),
				'title' => ucfirst(str_replace('_', ' ', (string) ($payload['error'] ?? 'error'))),
				'detail' => (string) ($payload['message'] ?? 'Request failed'),
			]],
			'meta' => [
				'version' => 'v1',
				'timestamp' => $timestamp,
			],
		];
	}

	return [
		'data' => $payload,
		'meta' => [
			'version' => 'v1',
			'timestamp' => $timestamp,
		],
	];
};

http_response_code($status);
header('Content-Type: application/json');
echo json_encode($jsonApiBody($body, $status), JSON_PRETTY_PRINT);
