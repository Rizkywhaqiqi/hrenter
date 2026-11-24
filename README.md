# HREnter

Next.js 15, Prisma 6, MySQL Aiven. Configuration follows HRjj's separate DB variables.

1. Use Node.js 22 and run npm install.
2. Copy .env.example to .env, fill DB_PASSWORD, AUTH_SECRET (32+ bytes), SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (16–72 bytes). For Aiven configure its CA certificate if required.
3. Run npm run db:setup (creates schema and seeds admin), then npm run dev.
   Alternatively npm run db:migrate followed by npm run db:seed.

Setup only targets db_jojogrp. No reset or accept-data-loss flags; review schema changes before running on populated databases. Existing active admin passwords are preserved. Other roles have no permissions until explicitly granted. Legacy sql/ files are PostgreSQL and must not be run.

Vercel: root directory default, Next.js, npm run build. Set DB_* and AUTH_SECRET as server-only environment variables; legacy DATABASE_URL and JWT_SECRET remain supported. Never set bootstrap passwords on Vercel or run setup in the build. Remove seed credentials locally after use. Validate build, tenant isolation, login and database connectivity before production.
