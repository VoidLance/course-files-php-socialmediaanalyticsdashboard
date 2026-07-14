# Project 5: Social Media Analytics Dashboard

A full-stack, multi-tenant analytics platform for aggregating social media data, managing content, generating reports, and exposing a third-party API.

## Scope Lock

This project is intentionally aligned to the Project 5 brief requirements only.

- In scope: the 11 functional features, technical requirements, and development phases listed in the brief.
- Out of scope by default: optional Additional Challenges unless explicitly requested.

## Stack

- Backend: PHP 8.x (Laravel-ready architecture)
- Frontend: React + Vite + Tailwind CSS (scaffolded)
- Relational DB: MySQL 8
- Document DB: MongoDB 7
- Cache/Queues/WebSockets: Redis
- Background processing: queue workers + scheduler
- Infrastructure: Docker Compose + Nginx

## Repository Layout

- backend/: API and domain services
- frontend/: SPA dashboard client
- docs/: architecture, roadmap, API contracts
- infra/: Docker and Nginx configs

## Feature Coverage Plan

- User management: registration, MFA, roles, team collaboration
- Platform integration: OAuth connectors for Facebook, Instagram, Twitter, LinkedIn, YouTube
- Data aggregation: posts, engagement, followers, reach/impressions, historical snapshots
- Analytics dashboard: cross-platform + platform-specific metrics
- Content management: drafts, scheduler, calendar, bulk posting
- Reporting: PDF/CSV/XLSX, scheduled email reports, white-labeling
- Competitor analysis, sentiment analysis, hashtag tracking
- Alerts, notifications, webhooks, public API

## Current Implementation Status

Implemented now:

- User registration/login, email verification, MFA
- Team and role-aware access controls
- Social account connection and live sync (Facebook, Instagram, Twitter, LinkedIn, YouTube)
- Competitor tracking and sync
- KPI overview, platform-specific analytics, comparison, sentiment, hashtag trending
- Drafts, scheduling, bulk scheduling, and calendar management
- Alerts, notifications, webhook subscriptions and event dispatch
- Report queueing and export in CSV/XLSX/PDF baseline outputs
- JSON:API-style response envelope and versioned `/v1` endpoints

Still partial or pending:

- Full OAuth callback and token refresh lifecycle per platform
- Full MySQL/Mongo runtime repository layer (state currently file-backed for local runtime)
- Redis-backed queue/cache + websocket push updates
- Production-grade report rendering, email delivery, white-labeling
- Broad unit/e2e coverage and production autoscaling operations

Detailed status is tracked in [docs/compliance-matrix.md](docs/compliance-matrix.md).

## Quick Start (Docker)

1. Copy .env.example to .env and adjust values.
2. Start stack:
   docker compose -f infra/docker/docker-compose.yml up -d --build
3. Services:
   - API gateway: <http://localhost:8080>
   - MySQL: localhost:3306
   - MongoDB: localhost:27017
   - Redis: localhost:6379
4. Import SQL schema from backend/database/migrations/mysql/001_initial_schema.sql
5. Seed starter data and begin implementing endpoints described in docs/api-v1.yaml

## Local Validation Commands

Backend syntax:

```bash
cd backend
find . -name "*.php" -print0 | xargs -0 -n1 php -l
```

Backend integration script:

```bash
cd backend
php tests/Integration/auth_mfa_flow.php
```

Frontend build:

```bash
cd frontend
npm ci
npm run build
```

## Notes About Framework Bootstrapping

Composer is not installed in the current environment, so this repository includes a framework-ready structure and contracts first. Once Composer is available, initialize Laravel in backend/ and map generated app structure onto the existing domain and route contracts.

## Delivery Phases

Detailed timeline and milestones are in docs/roadmap.md.

## Project Brief Traceability

To make grading and review straightforward, the repository includes explicit traceability documents:

- docs/compliance-matrix.md: concise implemented/partial/pending mapping.
- docs/implementation-status.md: requirement-by-requirement evidence with notes.
- docs/testing-strategy.md: test pyramid, critical flows, and execution commands.
- docs/api-v1.yaml: versioned API contract with request/response schemas.

## Technical Requirement Notes

- PHP framework posture: backend is Laravel-ready and Composer-managed; runtime endpoints are currently implemented as lightweight route handlers to keep local setup simple.
- Database posture: runtime state supports MySQL/PostgreSQL-backed persistence when DB credentials are configured, with file-based fallback for offline development.
- NoSQL posture: MongoDB collection design and ingestion blueprint are documented in backend/database/migrations/mongo/001_collections.md.
- Queue/cache posture: Redis and worker roles are provisioned in infra/, with incremental production hardening tracked in docs/implementation-backlog.md.

## Known Limitations (Current Stage)

- Social platform OAuth flows are implemented for local integration testing, but provider-specific production hardening (advanced retry policy and platform edge cases) remains iterative.
- Report rendering is baseline (text-backed PDF placeholder and tabular CSV/XLSX payload output) and intended to be upgraded to production templates.
- The current sentiment engine is heuristic (lexicon-based), which satisfies the base brief sentiment requirement.
