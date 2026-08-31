# MartFlow

Retail ERP for a physical mart: suppliers, purchases, inventory, products, POS, sales, customers, cash, expenses, reports, and P&L.

Stack: Next.js 16 App Router, TypeScript, Tailwind CSS v4, Firebase Auth / Firestore / Storage.

## Phase 1 (current)

Scaffold only: `src/` architecture, staff shell (sidebar + topbar), theme, UI primitives, Firebase client/admin config, role/permission constants, and empty module routes. No fake metrics. Authentication is not connected yet.

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Fill `NEXT_PUBLIC_FIREBASE_*` from a Firebase web app. Never put Admin credentials in `NEXT_PUBLIC_*` variables.

```bash
npm run lint
npm run build
```

Open [http://localhost:3000](http://localhost:3000). The home route redirects to `/dashboard`.
