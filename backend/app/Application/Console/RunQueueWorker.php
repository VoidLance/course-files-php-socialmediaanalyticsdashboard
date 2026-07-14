<?php

declare(strict_types=1);

namespace App\Application\Console;

final class RunQueueWorker
{
    public function __invoke(): void
    {
        $stateFile = dirname(__DIR__, 3) . '/storage/app_state.json';
        if (!is_file($stateFile)) {
            echo "No state file found, worker exited\n";
            return;
        }

        $raw = file_get_contents($stateFile);
        $state = json_decode(is_string($raw) ? $raw : '{}', true);
        if (!is_array($state)) {
            echo "State file is not valid JSON, worker exited\n";
            return;
        }

        $now = time();
        $published = 0;
        foreach (($state['scheduledPosts'] ?? []) as $idx => $post) {
            if (!is_array($post) || (string) ($post['status'] ?? '') !== 'queued') {
                continue;
            }

            $scheduledAt = strtotime((string) ($post['scheduledFor'] ?? ''));
            if ($scheduledAt === false || $scheduledAt > $now) {
                continue;
            }

            $state['scheduledPosts'][$idx]['status'] = 'published';
            $state['scheduledPosts'][$idx]['publishedAt'] = gmdate('c');
            $published++;
        }

        $completedReports = 0;
        foreach (($state['reports'] ?? []) as $idx => $report) {
            if (!is_array($report) || (string) ($report['status'] ?? '') !== 'queued') {
                continue;
            }

            $state['reports'][$idx]['status'] = 'ready';
            $state['reports'][$idx]['readyAt'] = gmdate('c');
            $completedReports++;
        }

        file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT));
        echo "Queue worker completed: published={$published}, reports_ready={$completedReports}\n";
    }
}
