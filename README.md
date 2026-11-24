# HREnter

Next.js 15, native MySQL (mysql2), Aiven. Copy .env.example to .env and fill DB_PASSWORD, AUTH_SECRET and SUPER_ADMIN_PASSWORD. Run npm install, npm run db:migrate, npm run db:seed, npm run dev. Alternatively npm run db:setup combines migration and seed. SQL migrations are tracked in schema_migrations. Never run setup automatically on Vercel. DB_NAME must be db_jojogrp. Existing admin passwords are preserved. Vercel uses DB_* and AUTH_SECRET; legacy DATABASE_URL/JWT_SECRET are supported. Use Aiven CA for verified TLS. Validate build and access controls before production.
