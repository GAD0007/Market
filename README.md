# MarketMadeEasyAbj

Independent React + Express application. It does not use Firebase and does not deploy to or modify the original AI Studio application.

## Local development

Requires Node.js 24+.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000`. The API runs on `http://localhost:8787`, and Vite proxies `/api` requests to it.

The first account registered with the email in `ADMIN_EMAIL` receives administrator access. Local data is stored in `server/data/market-boys.sqlite`; that directory is excluded from Git.

## Commands

- `npm run dev` — start the API and website together.
- `npm run dev:web` — start only the website (requires the API to already be running).
- `npm run lint` — type-check the frontend.
- `npm run build` — build the frontend.
- `npm start` — run the API and serve `dist` when `NODE_ENV=production`.

## Payments

Payment initialization is disabled until a provider is selected. Provider secrets and webhook verification belong on the API server, never in `VITE_*` variables.

## Current video limitation

Camera preview and item selection work. Remote WebRTC calling is temporarily preview-only while the replacement realtime signaling service is completed.
