# HRD Enterprise MVP

MVP awal HRD Enterprise: Next.js + Supabase.

## Sudah tersedia
- Login
- Dashboard
- Master Company
- Master Brand
- Master Outlet
- Master Department
- Master Position
- Master Karyawan
- User Management dasar
- Pembuatan user baru dari server

## Arsitektur akses
User -> Role -> Permission -> Company/Brand/Outlet Access

SUPER_ADMIN adalah administrator aplikasi pertama.
OWNER tidak diberi akses otomatis dan nanti diatur melalui User Management.

## Environment Variables
Buat `.env.local` atau isi Environment Variables di Vercel:

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

SERVICE ROLE KEY WAJIB hanya di server/Vercel. Jangan masukkan ke GitHub.

## Menjalankan lokal
npm install
npm run dev

## Deploy
Upload folder project ini ke GitHub, lalu import repository tersebut ke Vercel.
Tambahkan 3 environment variables di atas sebelum deploy.

## Super Admin pertama
1. Supabase > Authentication > Users > Add user.
2. Ambil UUID user.
3. Jalankan `sql/01_first_superadmin.sql` setelah mengganti UUID.
