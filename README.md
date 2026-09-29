# Social Media Analytics Dashboard

[![CI](https://github.com/VoidLance/course-files-php-socialmediaanalyticsdashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/VoidLance/course-files-php-socialmediaanalyticsdashboard/actions/workflows/ci.yml)

A full-stack dashboard for connecting social accounts, reviewing engagement analytics, planning content, and generating reports. The project includes a React single-page app and a versioned PHP REST API.

## Features

- User registration, email verification, MFA, and role-aware team access.
- Social account connection and baseline OAuth/sync flows for Facebook, Instagram, Twitter/X, LinkedIn, and YouTube.
- Cross-platform and per-platform analytics, period comparisons, sentiment summaries, and trending hashtags.
- Content drafts, scheduled posts, bulk scheduling, and a calendar view.
- Competitor tracking, metric alerts, in-app notifications, webhook subscriptions, and report exports.

This is an actively developed project baseline, not a production-ready social publishing service. Some integrations and operational features still need production hardening; see the [implementation status](docs/compliance-matrix.md) and [backlog](docs/implementation-backlog.md).

## Requirements

- PHP 8.2 or newer, with the JSON and PDO extensions.
- Node.js 22 or newer and npm.
- Composer is optional for the local runtime; it is used to install the backend's declared development dependencies.

## Get started

The simplest local setup runs the API and frontend in separate terminals. The backend persists demo state in `backend/storage/app_state.json` unless database-backed state is configured.

1. Start the API:

   ```bash
   cd backend
   php -S 127.0.0.1:8088 -t public public/index.php
   ```

2. In another terminal, install and start the frontend:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

3. Open <http://localhost:5173>. The frontend sends API requests through its Vite proxy to `http://localhost:8088`.

On a fresh state, the app opens the account-registration form. Create an account to register and sign in; the local flow verifies the email using the token returned by the API. No preconfigured demo account is required.

Check that the API is responding:

```bash
curl http://localhost:8088/api/v1/auth/bootstrap-status
```

The project also includes a Docker Compose configuration in [`infra/docker/docker-compose.yml`](infra/docker/docker-compose.yml) for the Nginx/PHP-FPM, frontend, MySQL, MongoDB, Redis, and MailHog services. Its settings are intended for local development; the native setup above is the straightforward option for trying the UI and API together.

## Validate changes

Run the backend syntax check and integration flows from the repository root:

```bash
find backend -name '*.php' -print0 | xargs -0 -n1 php -l
cd backend
php tests/Integration/auth_mfa_flow.php
php tests/Integration/content_reporting_flow.php
```

Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

More details are in the [testing strategy](docs/testing-strategy.md).

## Documentation

- [Architecture overview](docs/architecture.md)
- [Versioned API contract](docs/api-v1.yaml)
- [Feature compliance and implementation status](docs/compliance-matrix.md)
- [Implementation backlog](docs/implementation-backlog.md)
- [Project roadmap](docs/roadmap.md)

## Help and contributing

For questions or bugs, [open a GitHub issue](https://github.com/VoidLance/course-files-php-socialmediaanalyticsdashboard/issues). Before reporting an issue, check the documentation above and include the steps to reproduce the problem and relevant environment details.

The repository is maintained by its GitHub maintainers; see the [contributors page](https://github.com/VoidLance/course-files-php-socialmediaanalyticsdashboard/graphs/contributors) for current project contributors. Contributions are welcome through pull requests. Please keep changes focused, describe their effect, and run the relevant validation commands above. There is not currently a separate `CONTRIBUTING.md`.

## License

No `LICENSE` file is currently included in this repository. Check with the maintainers before redistributing or reusing the project.
