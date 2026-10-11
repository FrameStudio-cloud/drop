# drop — send files between your devices, no cable, no login

Open the site on device A → drop files → get a 6-digit code + QR.
Open it on device B → type the code or scan → download. Files expire after 24h.

## Stack
- **client/** — React + Vite + JSX, feature-modules (`features/send`, `receive`, `qr-share`, `history`, `devices`), Apple-HIG tokens in `src/app/global.css`
- **server/** — Node Express relay: Neon Postgres metadata + Cloudflare R2 bytes via presigned URLs
- **db/schema.sql** — `transfers` + `files`

## Zero-config local run (no keys)
```powershell
cd C:\Users\Administrator\drop\server; npm install; npm run dev
cd C:\Users\Administrator\drop\client; npm install; npm run dev
```
Client → http://localhost:5173, API → http://localhost:4000/api/health

## Cloud mode (Neon only — no card)
1. `psql $DATABASE_URL -f db/schema.sql` (or paste it in Neon's SQL Editor)
2. `cp .env.example server/.env` → fill `DATABASE_URL` only
3. Restart server — health should show `{"neon":true,"storage":"neon"}`
4. Limits in this mode: 25 MB/file, 100 MB/transfer (tune via `NEON_MAX_*`).
   Big videos want R2 instead — add the `R2_*` vars and the server switches automatically.

## R2 mode (big files, card required)
Fill `R2_*` + set the bucket CORS for PUT/GET from your domain.

## Feature independence rule
`features/X` may import from `shared/` + `entities/` only — never from another `features/`.
Each feature exposes a single `index.jsx`. Add `features/p2p` or `features/auth` later without touching send/receive.
