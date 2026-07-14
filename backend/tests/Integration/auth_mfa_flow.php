<?php

declare(strict_types=1);

$stateFile = dirname(__DIR__, 2) . '/storage/app_state.json';
$backup = is_file($stateFile) ? (string) file_get_contents($stateFile) : '';

$assert = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
};

$generateTotp = static function (string $secret): string {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $clean = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');

    $bits = '';
    for ($i = 0, $len = strlen($clean); $i < $len; $i++) {
        $idx = strpos($alphabet, $clean[$i]);
        if ($idx === false) {
            continue;
        }

        $bits .= str_pad(decbin((int) $idx), 5, '0', STR_PAD_LEFT);
    }

    $decoded = '';
    for ($i = 0, $len = strlen($bits); $i + 8 <= $len; $i += 8) {
        $decoded .= chr(bindec(substr($bits, $i, 8)));
    }

    $counter = (int) floor(time() / 30);
    $binaryCounter = pack('N*', 0) . pack('N*', $counter);
    $hash = hash_hmac('sha1', $binaryCounter, $decoded, true);
    $offset = ord(substr($hash, -1)) & 0x0F;
    $segment = substr($hash, $offset, 4);
    $value = unpack('N', $segment);

    return str_pad((string) (($value[1] & 0x7fffffff) % 1000000), 6, '0', STR_PAD_LEFT);
};

try {
    file_put_contents($stateFile, json_encode([
        'users' => [],
        'teams' => [],
        'socialAccounts' => [],
        'competitors' => [],
        'drafts' => [],
        'scheduledPosts' => [],
        'alerts' => [],
        'notifications' => [],
        'webhooks' => [],
        'reports' => [],
        'hashtags' => [],
        'tokens' => [],
        'nextIds' => [
            'users' => 1,
            'teams' => 1,
            'socialAccounts' => 1,
            'competitors' => 1,
            'drafts' => 1,
            'scheduledPosts' => 1,
            'alerts' => 1,
            'notifications' => 1,
            'webhooks' => 1,
            'reports' => 1,
        ],
    ], JSON_PRETTY_PRINT));

    $routes = require dirname(__DIR__, 2) . '/routes/api.php';

    $register = $routes['POST']['/v1/auth/register'];
    $registerResponse = $register([
        'body' => [
            'email' => 'analyst@example.com',
            'password' => 'Str0ngPass!',
            'fullName' => 'Analytics User',
            'role' => 'analyst',
        ],
    ]);

    $assert((int) ($registerResponse['status'] ?? 0) === 201, 'Register should return 201');
    $verificationToken = (string) ($registerResponse['body']['emailVerificationToken'] ?? '');
    $assert($verificationToken !== '', 'Register should return email verification token');

    $verifyEmail = $routes['POST']['/v1/auth/verify-email'];
    $verifyEmailResponse = $verifyEmail(['body' => ['token' => $verificationToken]]);
    $assert((int) ($verifyEmailResponse['status'] ?? 0) === 200, 'Email verification should return 200');

    $login = $routes['POST']['/v1/auth/login'];
    $loginResponse = $login([
        'body' => [
            'email' => 'analyst@example.com',
            'password' => 'Str0ngPass!',
        ],
    ]);

    $assert((int) ($loginResponse['status'] ?? 0) === 200, 'Login should return 200 after verification');
    $token = (string) ($loginResponse['body']['accessToken'] ?? '');
    $assert($token !== '', 'Login should return access token');

    $enableMfa = $routes['POST']['/v1/auth/mfa/enable'];
    $enableMfaResponse = $enableMfa([
        'headers' => ['Authorization' => 'Bearer ' . $token],
        'body' => [],
    ]);

    $assert((int) ($enableMfaResponse['status'] ?? 0) === 200, 'MFA enable should return 200');
    $secret = (string) ($enableMfaResponse['body']['secret'] ?? '');
    $assert($secret !== '', 'MFA enable should return secret');

    $verifyMfa = $routes['POST']['/v1/auth/mfa/verify'];
    $verifyMfaResponse = $verifyMfa([
        'headers' => ['Authorization' => 'Bearer ' . $token],
        'body' => ['code' => $generateTotp($secret)],
    ]);

    $assert((int) ($verifyMfaResponse['status'] ?? 0) === 200, 'MFA verify should return 200');

    $loginWithoutMfaResponse = $login([
        'body' => [
            'email' => 'analyst@example.com',
            'password' => 'Str0ngPass!',
        ],
    ]);

    $assert((int) ($loginWithoutMfaResponse['status'] ?? 0) === 401, 'Login without MFA code should return 401 after MFA enable');

    $loginWithMfaResponse = $login([
        'body' => [
            'email' => 'analyst@example.com',
            'password' => 'Str0ngPass!',
            'mfaCode' => $generateTotp($secret),
        ],
    ]);

    $assert((int) ($loginWithMfaResponse['status'] ?? 0) === 200, 'Login with MFA code should return 200');

    echo "auth_mfa_flow: PASS\n";
} finally {
    file_put_contents($stateFile, $backup);
}
