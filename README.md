# Koldify Ops Hub Monorepo

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

Configured in `.env` and `.env.example`.

Important values included as requested:

- `DATABASE_URL=postgresql://postgres:Alimola@110@localhost:5433/Enrich_it`
- `REDIS_URL=redis://default:pFWQFbf7UGQnGvdwbjLDAFUlDSWs060C@redis-19168.c322.us-east-1-2.ec2.cloud.redislabs.com:19168`

## Run

```sh
npm install
npm run prisma:generate
npm run dev         # frontend
npm run dev:web     # web service
npm run dev:worker  # worker service
```

PowerShell helpers:

- `./scripts/start-web.ps1`
- `./scripts/start-worker.ps1`

## Infrastructure

Local infra for development:

```sh
docker compose up -d
```

Services:

- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`

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
