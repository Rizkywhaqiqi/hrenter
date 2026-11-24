# HRD Enterprise

Next.js 15, React 19, TypeScript, Prisma 6, MySQL (Aiven).

## Local setup
1. Use Node.js 22. Run commands from the repository root.
2. Copy `.env.example` to `.env` and configure DATABASE_URL (use database `db_jojogrp` for the existing Aiven service, not for isolated development tests) and a random JWT_SECRET of at least 32 bytes (e.g. openssl rand -hex 32).
3. Run `npm install`, `npm run prisma:validate`, `npm run typecheck`, then `npm run dev`.
4. For a new empty development database only, review the schema and create a migration using `npm run prisma:migrate -- --name init`. For an existing database, inspect schema drift and establish a migration baseline first. Never reset the production database.

## Vercel
Leave Root Directory at the repository root (default) and set Framework to Next.js. Configure DATABASE_URL and JWT_SECRET as server-side environment variables. Rotate any previous JWT secret and verify Aiven TLS using its CA instructions. Build command: npm run build. Do not run migrations automatically at build time.

## Security
SUPER_ADMIN is the only system administrator; other users require permissions and explicit access scopes. Production release requires testing tenant isolation, login throttling, and all CRUD routes. Legacy SQL in sql/ targets PostgreSQL/Supabase and must not be executed against MySQL. No default admin credentials are supplied.

## Status
Foundation cleanup has been merged; validation is still required. Do not deploy to production until build, access-control and database compatibility checks pass.

## Initial database setup (db_jojogrp)
For the new empty HREnter database, set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (16–72 bytes) in the local .env and run `npm run db:setup`. This validates and pushes the schema without reset or data-loss flags, then creates roles, permissions and the first Super Admin. Existing active Super Admin passwords are never changed and existing non-admin accounts are never elevated. Remove bootstrap credentials after use. Never run this in the Vercel build; review schema changes before running on populated databases.
