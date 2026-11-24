# HRD Enterprise

Next.js 15, React 19, TypeScript, Prisma 6, MySQL (Aiven).

## Local setup
1. Use Node.js 22. Run commands inside `HRD-Enterprise`.
2. Copy `.env.example` to `.env` and configure DATABASE_URL and a random JWT_SECRET of at least 32 bytes (e.g. openssl rand -hex 32).
3. Run `npm install`, `npm run prisma:validate`, `npm run typecheck`, then `npm run dev`.
4. For a new empty development database only, review the schema and create a migration using `npm run prisma:migrate -- --name init`. For an existing database, inspect schema drift and establish a migration baseline first. Never reset the production database.

## Vercel
Set Root Directory to HRD-Enterprise and Framework to Next.js. Configure DATABASE_URL and JWT_SECRET as server-side environment variables. Rotate any previous JWT secret and verify Aiven TLS using its CA instructions. Build command: npm run build. Do not run migrations automatically at build time.

## Security
SUPER_ADMIN is the only system administrator; other users require permissions and explicit access scopes. Production release requires testing tenant isolation, login throttling, and all CRUD routes. Legacy SQL in sql/ targets PostgreSQL/Supabase and must not be executed against MySQL. No default admin credentials are supplied.

## Status
Foundation cleanup is under review. Do not deploy to production until build, access-control and database compatibility checks pass.
