# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HomiQ — a property management application with robust authentication and 2FA via email verification. Monorepo with a Next.js frontend and NestJS microservices backend.

## Commands

### Frontend (runs on port 4000)
```bash
cd frontend
npm run dev          # next dev -p 4000 --turbopack
npm run build        # next build
npm run lint         # next lint
```

### Backend (gateway on port 3000, services on 3001-3003)
```bash
cd backend
npm run start:dev              # Start all services (main gateway)
npm run start:dev main         # Gateway only
npm run start:dev auth         # Auth microservice only
npm run start:dev user         # User microservice only
npm run start:dev email        # Email microservice only
npm run build                  # nest build
npm run lint                   # eslint
npm run format                 # prettier --write
npm run test                   # jest unit tests
npm run test:e2e               # jest e2e tests
npm run test:cov               # jest with coverage
```

### Docker
```bash
cd backend
docker-compose up              # Start all backend services
```

## Architecture

### Frontend (`frontend/`)
- **Next.js 16** with React 19, App Router, Turbopack
- **Auth**: next-auth 5 (beta) with JWT session strategy — configured in `frontend/src/auth.ts`
- **Providers**: Google OAuth + Credentials (email/password)
- **Route protection**: `frontend/src/proxy.ts` middleware checks token expiry, redirects to signout if refresh token expired
- **Route groups**: `(routes)/auth/` for public auth pages, `(routes)/(protected)/` for authenticated pages
- **UI**: Tailwind CSS + MUI + Radix/shadcn components
- **Forms**: React Hook Form + Zod schemas (in `src/schemas/`)
- **Server actions**: `src/app/actions/` for auth form submissions
- **Protected routes**: `/home`, `/test`, `/dashboard`

### Backend (`backend/`)
NestJS microservices communicating via TCP transport:

| Service | Port | Role |
|---------|------|------|
| `main`  | 3000 | API gateway — REST endpoints at `/api/v1/auth/*`, forwards to microservices via TCP |
| `auth`  | 3001 | Authentication logic — JWT generation, token refresh, email verification |
| `user`  | 3002 | User CRUD — MongoDB/Mongoose, bcrypt (15 salt rounds) |
| `email` | 3003 | Transactional email via Resend + react-email templates, i18n (Spanish default) |

**Key patterns:**
- Gateway (`apps/main`) receives HTTP, converts to TCP `ClientProxy.send()` calls
- Exception filters convert between HTTP and RPC exceptions (`libs/shared/exceptions/`)
- Abstract base repository in `libs/shared/repositories/base.repository.ts`
- Passport strategies for JWT and refresh tokens in `apps/auth/src/infrastructure/strategies/`
- Proxy classes in each service's `infrastructure/external/` handle cross-service communication
- Shared DTOs in `libs/shared/dto/`

### Auth Flow
1. User signs up → `auth` service creates user via `user` service → generates 6-digit verification code (15min expiry) → `email` service sends code via Resend
2. User enters code on `EmailVerificationCard` OTP input → backend verifies code + JWT verification token → sets `emailVerified: true`
3. Sign in → backend validates credentials → returns access token (1d) + refresh token (7d)
4. Frontend stores tokens in NextAuth JWT session with expiry timestamps
5. `proxy.ts` middleware checks expiry on each request, auto-refreshes access token if needed

### Database
- **MongoDB** — connection URI via `MONGO_URI` env var (default: `mongodb://localhost:27017/nextjs_nestjs_2fa`)
- Single `User` collection with Mongoose schema at `apps/user/src/infrastructure/schemas/user.schema.ts`
- Fields: firstName, lastName, email (unique), phoneNumber, password (bcrypt), emailVerified, emailVerification.code/expiresAt

## Environment Variables

### Frontend
- `NEST_BACKEND_PUBLIC_API_URL` — backend API base URL
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `AUTH_SECRET` — NextAuth secret

### Backend (validated via Joi in env.validation.ts)
- `JWT_SECRET` (required), `JWT_SECRET_EXPIRES_IN` (default: 1d)
- `MONGO_URI` (required)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (required)
- `AUTH_SERVICE_HOST/PORT` (default: localhost:3001)
- `USER_SERVICE_HOST/PORT` (default: localhost:3002)
- `EMAIL_SERVICE_HOST/PORT` (default: localhost:3003)
- `FRONTEND_URL` (default: http://localhost:4000)
