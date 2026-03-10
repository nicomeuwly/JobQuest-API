# JobQuest API (Elysia + Prisma)

## Local setup
```bash
cp .env.example .env
bunx prisma generate
bunx prisma db push
bun run dev
```

API base URL: `http://localhost:3001/api/v1`

## Docker setup
```bash
cp .env.example .env
# Set DATABASE_URL in .env to your external PostgreSQL database.
docker compose up --build
```

Services:
- API: `http://localhost:3001/api/v1`

Useful commands:
```bash
docker compose down
```

## Authentication
- `POST /auth/register`
- `POST /auth/login`

Use the returned JWT in `Authorization: Bearer <token>` for all protected routes.

## Account
- `GET /account`
- `PATCH /account`
- `DELETE /account`

## Job applications
- `POST /jobs`
- `GET /jobs`
- `GET /jobs/:id`
- `PATCH /jobs/:id`
- `PATCH /jobs/:id/status`
- `DELETE /jobs/:id`
