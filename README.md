# miso_store – Dev Guide

## Quick Start

1. Install deps and Netlify CLI

```powershell
npm install
npx netlify-cli --version
```

2. Run unified dev (functions + Vite)

```powershell
npx netlify dev
```

This starts Netlify Dev (port 8888) and your Vite app (port 5173). Requests to `/.netlify/functions/*` are proxied automatically (see `vite.config.js`).

## Verifying APIs

```powershell
Invoke-WebRequest -Uri http://localhost:5173/.netlify/functions/inventory | Select-Object -Expand Content
Invoke-WebRequest -Uri http://localhost:5173/.netlify/functions/transactions | Select-Object -Expand Content
```

## Persistent local data

When Netlify Blobs isn’t available locally, functions persist to `netlify/local-data.json`. This keeps your inventory and transactions across restarts.

## Common issues

- If you run `npm run dev` alone, functions 404/ECONNREFUSED. Use `netlify dev`.
- SPA refresh: handled in `netlify dev`. For production, `public/_redirects` includes `/* /index.html 200`.
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
