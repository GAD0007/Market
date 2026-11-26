# MarketMadeEasyAbj

React and Vite application backed by Firebase Authentication and Cloud Firestore.

## Local development

Requires Node.js 24+.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Fill the `VITE_FIREBASE_*` entries in `.env`, then open `http://localhost:3000`.

## Firebase

- Email/password accounts are managed by Firebase Authentication.
- Application data and realtime subscriptions use Cloud Firestore.
- Security rules live in `firestore.rules` and must be deployed before using the app.
- The bootstrap admin must verify the configured email address. Additional admins are stored in `adminGrants` by UID.

Deploy rules and indexes with an authorized Firebase account:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

## Commands

- `npm run dev` — start the website locally.
- `npm run lint` — type-check the application.
- `npm run build` — create a production build.
- `npm run preview` — preview the production build.

## Payments

Payment initialization remains disabled until a provider is selected. Provider secrets and webhook verification must run in a trusted server function and must never be stored in `VITE_*` variables or browser code.

## Current video limitation

Camera preview and item selection work. Remote WebRTC calling uses Firestore signaling but still requires production TURN infrastructure for reliable connectivity across restrictive networks.
