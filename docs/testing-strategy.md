# Testing Strategy

## Goals

- Validate critical product flows required by the project brief.
- Prevent regressions in authentication, integrations, analytics, and reporting.
- Keep test execution fast enough for local development and CI.

## Test Pyramid

1. Unit Tests

- Scope: pure helpers and deterministic logic (formatting, scoring thresholds, aggregation helpers).
- Target: fast, isolated, no IO.

1. Integration Tests

- Scope: route handlers and state transitions across related endpoints.
- Target: realistic request/response behavior with seeded state.

1. End-to-End Tests

- Scope: frontend-authenticated user journeys through API-backed pages.
- Target: smoke validation of critical UI flows.

## Current Coverage

- Integration: backend/tests/Integration/auth_mfa_flow.php
  - register -> verify email -> login -> enable MFA -> verify MFA -> MFA-gated login.
- Integration: backend/tests/Integration/content_reporting_flow.php
  - auth bootstrap -> social connection -> sync -> drafts/scheduling -> alerts -> reports/export.

## Critical Scenarios To Keep Passing

1. Identity and Access

- Registration rejects invalid payloads.
- Email verification required before protected operations.
- MFA-enabled users cannot login without valid code.

1. Platform and Data Flows

- OAuth/social account connection persists platform account metadata.
- Sync updates metrics and recent posts.
- Token refresh updates expiry and encrypted credentials.

1. Analytics and Intelligence

- Overview and platform analytics endpoints return KPI payloads.
- Sentiment and hashtag endpoints return expected structures.

1. Content and Reporting

- Draft creation and schedule endpoints accept valid payloads.
- Bulk schedule rejects empty/invalid item collections.
- Report generation and export produce format-specific payloads.

1. Alerts and Notifications

- Alert evaluation creates notifications when thresholds are crossed.
- Notification listing remains auth-scoped.

## Local Execution

Run integration scripts directly:

```bash
cd backend
php tests/Integration/auth_mfa_flow.php
php tests/Integration/content_reporting_flow.php
```

Run PHPUnit suite when dependencies are available:

```bash
cd backend
composer install
vendor/bin/phpunit
```

## CI Guidance

- Trigger tests on pull requests and pushes to main.
- Execute syntax checks before tests.
- Publish test summary artifacts for reviewer visibility.

## Near-Term Improvements

- Add dedicated unit tests for sentiment/hashtag helper behavior.
- Add contract tests for docs/api-v1.yaml request and response schemas.
- Add browser e2e smoke tests for auth, dashboard load, and report export.
