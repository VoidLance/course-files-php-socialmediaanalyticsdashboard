<?php

declare(strict_types=1);

$stateFile = dirname(__DIR__, 2) . '/storage/app_state.json';
$backup = is_file($stateFile) ? (string) file_get_contents($stateFile) : '';

$assert = static function (bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
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
        'rawPayloads' => [],
        'oauthStates' => [],
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
    $verifyEmail = $routes['POST']['/v1/auth/verify-email'];
    $login = $routes['POST']['/v1/auth/login'];
    $createTeam = $routes['POST']['/v1/teams'];
    $createSocialAccount = $routes['POST']['/v1/social-accounts'];
    $overview = $routes['GET']['/v1/analytics/overview'];
    $platformAnalytics = $routes['GET']['/v1/analytics/platforms'];
    $createDraft = $routes['POST']['/v1/content/drafts'];
    $scheduleDraft = $routes['POST']['/v1/content/scheduled'];
    $bulkSchedule = $routes['POST']['/v1/content/bulk-schedule'];
    $createAlert = $routes['POST']['/v1/alerts'];
    $evaluateAlerts = $routes['POST']['/v1/alerts/evaluate'];
    $listNotifications = $routes['GET']['/v1/notifications'];
    $createReport = $routes['POST']['/v1/reports'];
    $exportReport = $routes['POST']['/v1/reports/export'];

    $registerResponse = $register([
        'body' => [
            'email' => 'manager@example.com',
            'password' => 'Str0ngPass!',
            'fullName' => 'Manager User',
            'role' => 'manager',
        ],
    ]);

    $assert((int) ($registerResponse['status'] ?? 0) === 201, 'Register should return 201');
    $verificationToken = (string) ($registerResponse['body']['emailVerificationToken'] ?? '');
    $assert($verificationToken !== '', 'Register should return verification token');

    $verifyResponse = $verifyEmail(['body' => ['token' => $verificationToken]]);
    $assert((int) ($verifyResponse['status'] ?? 0) === 200, 'Email verification should return 200');

    $loginResponse = $login([
        'body' => [
            'email' => 'manager@example.com',
            'password' => 'Str0ngPass!',
        ],
    ]);

    $assert((int) ($loginResponse['status'] ?? 0) === 200, 'Login should return 200');
    $token = (string) ($loginResponse['body']['accessToken'] ?? '');
    $assert($token !== '', 'Login should return bearer token');

    $authHeaders = ['Authorization' => 'Bearer ' . $token];

    $teamResponse = $createTeam([
        'headers' => $authHeaders,
        'body' => ['name' => 'Growth Team'],
    ]);

    $assert((int) ($teamResponse['status'] ?? 0) === 201, 'Team creation should return 201');
    $teamId = (int) ($teamResponse['body']['id'] ?? 0);
    $assert($teamId > 0, 'Team id should be returned');

    $accountResponse = $createSocialAccount([
        'headers' => $authHeaders,
        'body' => [
            'teamId' => $teamId,
            'platform' => 'twitter',
            'accountName' => 'Brand Profile',
            'accountType' => 'business',
            'accessToken' => 'demo-token',
            'refreshToken' => 'demo-refresh',
            'externalAccountId' => 'tw_100',
        ],
    ]);

    $assert((int) ($accountResponse['status'] ?? 0) === 201, 'Social account creation should return 201');
    $accountId = (int) ($accountResponse['body']['id'] ?? 0);
    $assert($accountId > 0, 'Social account id should be returned');

    $overviewResponse = $overview(['headers' => $authHeaders]);
    $assert((int) ($overviewResponse['status'] ?? 0) === 200, 'Overview endpoint should return 200');
    $totals = $overviewResponse['body']['totals'] ?? null;
    $assert(is_array($totals), 'Overview should include totals payload');

    $platformResponse = $platformAnalytics([
        'headers' => $authHeaders,
        'query' => ['from' => '2026-01-01', 'to' => '2026-12-31'],
    ]);
    $assert((int) ($platformResponse['status'] ?? 0) === 200, 'Platform analytics should return 200');

    $draftResponse = $createDraft([
        'headers' => $authHeaders,
        'body' => [
            'title' => 'Weekly performance recap',
            'content' => 'Top engagement highlights for this week #growth',
        ],
    ]);
    $assert((int) ($draftResponse['status'] ?? 0) === 201, 'Draft creation should return 201');
    $draftId = (int) ($draftResponse['body']['id'] ?? 0);
    $assert($draftId > 0, 'Draft id should be returned');

    $scheduleResponse = $scheduleDraft([
        'headers' => $authHeaders,
        'body' => [
            'draftId' => $draftId,
            'scheduledFor' => '2026-07-21T09:00:00Z',
        ],
    ]);
    $assert((int) ($scheduleResponse['status'] ?? 0) === 202, 'Single schedule should return 202');

    $bulkResponse = $bulkSchedule([
        'headers' => $authHeaders,
        'body' => [
            'items' => [
                ['draftId' => $draftId, 'scheduledFor' => '2026-07-22T09:00:00Z'],
                ['draftId' => $draftId, 'scheduledFor' => '2026-07-23T09:00:00Z'],
            ],
        ],
    ]);
    $assert((int) ($bulkResponse['status'] ?? 0) === 202, 'Bulk schedule should return 202');

    $alertResponse = $createAlert([
        'headers' => $authHeaders,
        'body' => [
            'name' => 'Zero reach baseline',
            'metric' => 'reach',
            'operator' => 'eq',
            'threshold' => 0,
        ],
    ]);
    $assert((int) ($alertResponse['status'] ?? 0) === 201, 'Alert creation should return 201');

    $evaluateResponse = $evaluateAlerts([
        'headers' => $authHeaders,
        'body' => [],
    ]);
    $assert((int) ($evaluateResponse['status'] ?? 0) === 200, 'Alert evaluation should return 200');
    $triggeredCount = (int) ($evaluateResponse['body']['triggeredCount'] ?? 0);
    $assert($triggeredCount >= 1, 'At least one alert should trigger in baseline metric evaluation');

    $notificationsResponse = $listNotifications(['headers' => $authHeaders]);
    $assert((int) ($notificationsResponse['status'] ?? 0) === 200, 'Notifications endpoint should return 200');

    $reportResponse = $createReport([
        'headers' => $authHeaders,
        'body' => ['format' => 'csv'],
    ]);
    $assert((int) ($reportResponse['status'] ?? 0) === 202, 'Report queue endpoint should return 202');
    $reportId = (int) ($reportResponse['body']['id'] ?? 0);
    $assert($reportId > 0, 'Report id should be returned');

    $exportResponse = $exportReport([
        'headers' => $authHeaders,
        'body' => ['reportId' => $reportId],
    ]);
    $assert((int) ($exportResponse['status'] ?? 0) === 200, 'Report export should return 200');
    $contentBase64 = (string) ($exportResponse['body']['contentBase64'] ?? '');
    $assert($contentBase64 !== '', 'Report export should include file payload');

    echo "content_reporting_flow: PASS\n";
} finally {
    file_put_contents($stateFile, $backup);
}
