# Ledger Engine — Frontend

React banking dashboard for the Ledger Engine platform.

## Features

- **Authentication** — Sign up, login, forgot password (mock auth via localStorage)
- **Dashboard** — Wallet balances, total portfolio overview
- **Transfers** — Move funds between accounts
- **Ledger Audit** — Double-entry bookkeeping verification with interactive audit

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Lucide React icons

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Password reset |
| `/dashboard` | Overview (protected) |
| `/dashboard/transfer` | Transfer funds |
| `/dashboard/ledger` | Ledger audit |

## Environment

When the Go API is ready, add:

```
VITE_API_BASE_URL=http://localhost:8080
```
