<?php

declare(strict_types=1);

namespace App\Application\Console;

final class RunScheduledJobs
{
    public function __invoke(): void
    {
        $stateFile = dirname(__DIR__, 3) . '/storage/app_state.json';
        if (!is_file($stateFile)) {
            echo "No state file found, scheduler exited\n";
            return;
        }

        $raw = file_get_contents($stateFile);
        $state = json_decode(is_string($raw) ? $raw : '{}', true);
        if (!is_array($state)) {
            echo "State file is not valid JSON, scheduler exited\n";
            return;
        }

        $queuedReports = 0;
        $dayOfMonth = (int) gmdate('j');
        $weekday = (int) gmdate('N');

        $shouldQueueWeekly = $weekday === 1;
        $shouldQueueMonthly = $dayOfMonth === 1;

        if (($shouldQueueWeekly || $shouldQueueMonthly) && isset($state['nextIds']['reports'])) {
            $reportId = (int) ($state['nextIds']['reports'] ?? 1);
            $state['nextIds']['reports'] = $reportId + 1;
            $state['reports'][] = [
                'id' => $reportId,
                'format' => 'pdf',
                'status' => 'queued',
                'createdAt' => gmdate('c'),
                'schedule' => $shouldQueueMonthly ? 'monthly' : 'weekly',
            ];
            $queuedReports++;
        }

        $staleAccounts = 0;
        $staleCutoff = time() - (60 * 60 * 24 * 2);
        foreach (($state['socialAccounts'] ?? []) as $idx => $account) {
            $lastSync = strtotime((string) ($account['lastSyncAt'] ?? ''));
            if ($lastSync === false || $lastSync >= $staleCutoff) {
                continue;
            }

            $state['socialAccounts'][$idx]['status'] = 'stale';
            $staleAccounts++;
        }

        file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT));
        echo "Scheduled jobs completed: queued_reports={$queuedReports}, stale_accounts={$staleAccounts}\n";
    }
}
