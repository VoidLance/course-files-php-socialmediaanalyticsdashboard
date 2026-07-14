# Architecture Blueprint

## System Context

The platform ingests data from social APIs, stores normalized metrics for analytics, stores raw payloads for replay/audit, processes heavy workloads asynchronously, and exposes both web dashboards and API integrations.

## High-Level Components

1. API Gateway (PHP backend)
- Auth, RBAC, team boundaries, JSON:API responses
- Serves dashboard data and third-party REST API

2. Integration Connectors
- One connector per platform (Facebook, Instagram, Twitter, LinkedIn, YouTube)
- Handles OAuth, token refresh, pagination, retries, rate limiting

3. Data Processing Pipeline
- Queue jobs for ingestion, normalization, enrichment, sentiment scoring
- Schedules recurring sync jobs and report generation

4. Storage
- MySQL: relational entities, permissions, scheduled jobs, normalized metrics
- MongoDB: raw payloads, comments, high-volume unstructured documents
- Redis: cache, queue broker, websocket pub/sub

5. Frontend SPA
- React dashboard with metric cards, trends, cross-platform comparisons, calendar

6. Notification and Reporting Services
- Email and in-app alerts
- PDF/CSV/XLSX exports and scheduled delivery

## Domain Boundaries

- Identity and Access: users, MFA, sessions, team roles
- Account Connections: social account linking and token lifecycle
- Content Hub: drafts, scheduling, publishing workflows
- Analytics: KPIs, trends, engagement rates, demographics
- Competitive Intelligence: competitor account benchmarks
- Intelligence: sentiment and hashtag analytics
- Integrations: API, webhooks, external automation

## Security Controls

- JWT auth for API clients
- OAuth 2.0 per social platform
- Encrypted token storage at rest
- Signed webhook payloads
- Rate limits and role-scoped permissions
- Audit logs for sensitive actions

## Scaling Strategy

- Horizontal API workers behind load balancer
- Separate queue worker autoscaling for ingestion spikes
- Redis caching for dashboard reads
- Partitioned/archived historical metrics for long-term storage

## Local Runtime Persistence Strategy

- Primary persistence target is relational storage (MySQL/PostgreSQL) plus MongoDB for high-volume payloads.
- For low-friction coursework execution, runtime state can fall back to backend/storage/app_state.json when database services are unavailable.
- The backend route layer attempts DB-backed app state first when DB_* environment variables are configured, then gracefully falls back to file-backed state.
- This fallback enables full feature demonstrations in constrained local environments while preserving a clear migration path to production persistence.

## OAuth Connection Sequence

1. Client calls POST /v1/oauth/connect/init with platform, team, and account metadata.
2. API validates role, creates short-lived oauth state, and returns provider authorization URL.
3. User authorizes on provider and returns with authorization code.
4. Client submits state + code to POST /v1/oauth/connect/callback.
5. API exchanges code for access/refresh token, encrypts tokens at rest, and creates connected social account.
6. API archives raw token exchange payload metadata and emits sync webhooks.
