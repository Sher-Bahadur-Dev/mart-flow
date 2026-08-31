# MartFlow

Production-ready mart management system. Stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Firebase Auth, and Cloud Firestore.

Money is stored as decimal strings (`Decimal` with 2 places). Quantities use 3 places. Stock only changes through inventory movements. Khata balances are computed from transactions and are never overwritten.

## Requirements

- Node.js 20+
- npm
- A Firebase project with Authentication (Email/Password and Google) and Cloud Firestore enabled

## Setup

```bash
npm install
copy .env.example .env
```

Set `SESSION_SECRET` in `.env` to a random string of at least 32 characters:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use the existing Firebase project `mart-flow`. Register a web app and fill client keys:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use mart-flow
npx -y firebase-tools@latest apps:create web mart-flow-web
npx -y firebase-tools@latest apps:sdkconfig WEB
npx -y firebase-tools@latest deploy --only auth,firestore
```

Copy the web SDK config into the `NEXT_PUBLIC_FIREBASE_*` variables.

Admin SDK values:

- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` come from a service account JSON (Project settings → Service accounts). The most reliable option on Windows is `FIREBASE_SERVICE_ACCOUNT_PATH` pointing at that JSON file. If you paste `FIREBASE_PRIVATE_KEY`, put it on one line in double quotes and keep the `\n` sequences from the JSON `private_key` field.
- `NEXT_PUBLIC_FIREBASE_API_KEY` is the Web API key from Project settings → General, or from `apps:sdkconfig`.

On macOS/Linux use `cp .env.example .env`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are sent to `/login`. Create the first store owner at `/signup`.

The login page can render without Firebase. After sign-in the dashboard uses the Admin SDK, so missing Firebase env vars show **This page couldn't load**.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Permission, employee, money, and inventory unit tests |

## Username login

Sign-in accepts email or username. Username lookup uses the Firestore `users.username` field (equality). Single-field equality indexes are created automatically. If the Firebase console asks for an index, create a single-field ascending index on `users.username` (and `users.email` if prompted).

## Environment

```
NEXT_PUBLIC_APP_NAME="MartFlow"
SESSION_SECRET="replace-with-a-long-random-string-at-least-32-chars"
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

Never put `FIREBASE_PRIVATE_KEY` or `FIREBASE_CLIENT_EMAIL` in `NEXT_PUBLIC_*` variables. Do not commit `.env`.

### Vercel

1. Create a Firebase project and enable Email/Password auth plus Firestore.
2. In the Vercel project, set the same variables as `.env.example`.
3. Redeploy. The first owner is created through `/signup` — there is no database seed.

## Modules

- Auth, roles, and httpOnly sessions (Firebase Auth + Firestore profiles)
- Products, categories, barcodes, inventory movements
- POS (search, cart, cash/card/credit, hold/resume, F2/F4/F8/F9)
- Sales, returns, receipts (80mm print)
- Purchases: DRAFT → ORDERED → RECEIVED (stock in) → COMPLETED
- Customers, suppliers, khata (computed outstanding/payable)
- Expenses, dashboard, reports, CSV export
- Employees, notifications, audit log

## Business rules

- Payments on checkout must equal the sale total
- Credit sales require a customer and respect credit limits
- Receiving a purchase is the only purchase step that increases stock
- Profit = revenue − COGS − expenses
- Sale line items snapshot name, SKU, unit price, and cost price
