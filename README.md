# miso_store

Simple fish sales app with Netlify Functions backend.

## Features
- Frontend: React + Mantine
- Backend: Netlify Functions
  - Storage fallback: Netlify Blobs (JSON)
  - Optional SQL: Neon Postgres (set `NEON_DATABASE_URL`)
- Endpoints: `inventory`, `transactions`, `health`

## Setup
1. Install deps:
```
npm install
```
2. (Optional) Create `.env` for local dev:
```
copy .env.example .env
# edit NEON_DATABASE_URL
```
3. Run locally (functions + vite):
```
netlify dev
```
- Health check: http://localhost:8888/.netlify/functions/health

## Deploy
1. Configure on Netlify:
- Site settings → Environment variables → add `NEON_DATABASE_URL` (optional for SQL)
2. Deploy:
```
netlify deploy --prod
```

## API
- `GET /.netlify/functions/inventory`
- `POST /.netlify/functions/inventory` `{ action: "add|update|delete", item|id }`
- `GET /.netlify/functions/transactions`
- `POST /.netlify/functions/transactions` `{ action: "add|update|delete", tx|id }`
- `GET /.netlify/functions/health` → `{ backend: "neon"|"blobs", db: { ok } }`

## Notes
- Without `NEON_DATABASE_URL`, data uses Blobs and is scoped to the Netlify site.
- Frontend keeps localStorage for offline/fallback; backend is source of truth when available.
