<?php

declare(strict_types=1);

namespace App\Infrastructure\Http;

final class Router
{
    /** @var array<string, array<string, callable>> Route table: tiny but judgmental. */
    private array $routes;

    /** @param array<string, array<string, callable>> $routes Inject route map and pray for consistency. */
    public function __construct(array $routes)
    {
        $this->routes = $routes;
    }

    /**
     * Dispatch request to a handler, or a polite 404 if reality disagrees.
     * @param array<string, mixed> $request
     * @return array{status:int, body:array<string, mixed>}
     */
    public function dispatch(string $method, string $uri, array $request = []): array
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $handler = $this->routes[$method][$path] ?? null;

        if (!$handler) {
            return [
                'status' => 404,
                'body' => [
                    'error' => 'not_found',
                    'message' => 'Route not found',
                ],
            ];
        }

        $ref = new \ReflectionFunction($handler);
        if ($ref->getNumberOfParameters() > 0) {
            return $handler($request);
        }

        return $handler();
    }
}
