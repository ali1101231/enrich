# Enrich it Monorepo

Production-style monorepo with:

- `frontend`: existing React/Vite UI
- `apps/web`: Express API service (uploads, batch orchestration, scheduler, admin key management)
- `apps/worker`: BullMQ async worker (Blitz calls, retry, per-key rate limiting)
- `packages/shared`: shared types/constants/utils

## Folder Layout

```txt
apps/
	web/
		prisma/
			schema.prisma
		src/
			routes/
			controllers/
			services/
			queues/
			lib/
			middleware/
			prisma/
			server.ts

	worker/
		src/
			workers/
			services/
			lib/
			processors/
			index.ts

packages/
	shared/
		src/
			types/
			constants/
			utils/

frontend/
	src/
```

## Core Behavior

- Admin manages Blitz API keys and user-to-key assignments.
- Each API key capacity defaults to `20` users and `5 req/sec`.
- Auto-assignment picks least-loaded active key.
- Users never provide their own provider keys.
- Upload and pasted-input endpoints create chunked jobs (`10 rows/job` default).
- Batch/job metadata persists in PostgreSQL via Prisma.
- Worker executes jobs asynchronously via BullMQ.
- Per-key Bottleneck limit enforces `5 req/sec`.
- Fair scheduler refills queue round-robin across users.
- Per-user active job cap prevents one user from starving others.

## Environment

Configured in `.env` (copy from `.env.example`).

See `.env.example` for all required and optional variables with defaults.

## Local Setup

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and Redis)

### 1. Install dependencies

```sh
npm install
```

### 2. Start infrastructure

```sh
docker compose up -d
```

This starts PostgreSQL on `localhost:5433` and Redis on `localhost:6379`.

### 3. Configure environment

```sh
cp .env.example .env
```

Edit `.env` with your database credentials and any overrides.

### 4. Generate Prisma client

```sh
npm run prisma:generate
```

### 5. Run database migrations

```sh
npm run prisma:migrate
```

### 6. Start services

```sh
npm run dev         # all: frontend + web + worker
npm run dev:web     # web service only
npm run dev:worker  # worker service only
```

Frontend runs at `http://localhost:8080`, web API at `http://localhost:4000`.

PowerShell helpers:

- `./scripts/start-web.ps1`
- `./scripts/start-worker.ps1`

### Build for production

```sh
npm run build
npm run start       # starts web + worker
```

### Other scripts

```sh
npm run prisma:deploy   # apply migrations in production
npm run test            # run tests across workspaces
npm run lint            # lint across workspaces
```

## Sample Routes

- `POST /api/batches/upload`
- `POST /api/batches/paste`
- `GET /api/batches/:batchId/status`
- `GET /api/runs/history`
- `POST /api/admin/keys`
- `PATCH /api/admin/keys/:keyId/active`
- `POST /api/admin/assignments/manual`
- `POST /api/admin/assignments/auto`

## Sample Progress Shape

```json
{
	"batchId": "batch_cxy123",
	"totalRows": 250,
	"queuedRows": 120,
	"runningRows": 20,
	"completedRows": 100,
	"failedRows": 10,
	"percentageComplete": 44,
	"estimatedRemainingSeconds": 95
}
```
